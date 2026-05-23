const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EscrowPaymentService {
  static platformFeePercent = 0.10; // 10% Platform commission

  static async initializeAndLockEscrow(jobId, clientId) {
    return await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        lock: { mode: 'update' }
      });

      if (!job || job.clientId !== clientId) throw new Error('Job pairing lookup failed.');
      if (job.status !== 'PENDING') throw new Error('Job status out of lockable bounds.');

      const clientWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: clientId } });
      if (clientWallet.withdrawable.lessThan(job.budget)) {
        throw new Error('Insufficient wallet balance.');
      }

      await tx.wallet.update({
        where: { userId: clientId },
        data: {
          withdrawable: { decrement: job.budget },
          escrowLocked: { increment: job.budget }
        }
      });

      const platformIntake = job.budget.mul(this.platformFeePercent);

      const escrowRecord = await tx.escrow.create({
        data: {
          jobId: job.id,
          amount: job.budget,
          commissionAllocated: platformIntake,
          status: 'HELD'
        }
      });

      await tx.job.update({
        where: { id: job.id },
        data: { status: 'BROADCASTED' }
      });

      return escrowRecord;
    });
  }

  static async releaseEscrowToWorker(jobId, clientId) {
    return await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        include: { escrow: true },
        lock: { mode: 'update' }
      });

      if (!job || job.clientId !== clientId || !job.escrow) throw new Error('Escrow reference missing.');
      if (job.escrow.status !== 'HELD') throw new Error('Escrow must be held to release.');
      if (!job.workerId) throw new Error('Job missing assigned worker.');

      const grossValue = job.escrow.amount;
      const commission = job.escrow.commissionAllocated;
      const workerPayout = grossValue.sub(commission);

      await tx.wallet.update({
        where: { userId: clientId },
        data: {
          escrowLocked: { decrement: grossValue },
          balance: { decrement: grossValue }
        }
      });

      await tx.wallet.update({
        where: { userId: job.workerId },
        data: {
          balance: { increment: workerPayout },
          withdrawable: { increment: workerPayout }
        }
      });

      await tx.escrow.update({
        where: { id: job.escrow.id },
        data: { status: 'RELEASED' }
      });

      return { success: true, netDispatched: workerPayout };
    });
  }
}

module.exports = EscrowPaymentService;