import { supabase } from "./supabase.js";

export async function signIn({email, password}) {
    const {data,error} = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    })
    if (error) throw error
    return data.user
}

export async function getCurrentUser() {
    const {data} = await supabase.auth.getSession()
    if (data.session === null) {
        return null
    }
    const {data: {user}, error} = await supabase.auth.getUser()
    if (error) throw error
    return user
}

export async function logOut() {
    const {error} = await supabase.auth.signOut()
    if (error) throw error
}

export async function signUp({email, password, username}) {
    const {data: {user}, error} = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: username
            }
        }
    })
    if (error) throw error
    return user
}