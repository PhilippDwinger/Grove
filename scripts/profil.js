import { supabase } from "./supabase.js"
import { getCurrentUser } from "./auth.js"

export async function loadProfile() {
    const user = await getCurrentUser()
    if (user === null) return null

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    if (error) throw error
    return data
}

export async function saveProfile(changes) {
    const user = await getCurrentUser()
    if (user === null) {
        return null
    }
    const {data, error} = await supabase.from("profiles")
        .update(changes)
        .eq("id", user.id)
        .select()
        .single()
    if (error) throw error
    return data
}