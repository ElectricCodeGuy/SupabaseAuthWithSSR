export async function signInWithProvider(credentials: {
  provider: 'google' | 'github';
}) {
  const response = await fetch('/api/auth/sign-in-with-provider', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });

  const data = await response.json();
  return data.error;
}
