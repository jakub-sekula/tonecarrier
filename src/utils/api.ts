export async function getCredential(username: string, password: string) {
	const res = await fetch(`${process.env.API_URL}/jwt-auth/v1/token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password}) })

	if (!res.ok) return undefined

	const json = await res.json()
	return json.data
}