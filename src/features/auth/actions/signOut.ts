'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { signOutUser } from '../server/signOutUser';

export async function signOut(): Promise<void> {
  await signOutUser();
  revalidatePath('/', 'layout');
  redirect('/sign-in');
}
