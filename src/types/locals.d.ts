import type { Session, User } from '../db/schema.ts';

declare global {
  namespace App {
    interface Locals {
      user?: User;
      session?: Session;
    }
  }
}

export {};
