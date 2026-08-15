const BACKEND_UNAVAILABLE = "Backend unavailable";

export async function handleResponse(response) {
  const text = await response.text();
  let body = null;

  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      body?.error || body?.message || BACKEND_UNAVAILABLE,
    );
  }

  return body;
}

export { BACKEND_UNAVAILABLE };
