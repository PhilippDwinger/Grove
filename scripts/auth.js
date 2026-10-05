import { supabase } from "./supabase";

export async function sign_in(email, password) {
    const {data,error} = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    })
    if (error) throw error
    return data.user
}

export async function get_current_user() {
    const {data: {user}, error} = await supabase.auth.getUser()
    if (error) throw error
    return user
}

export async function logout() {
    const {error} = await supabase.auth.signOut()
    if (error) throw error
}

export async function sign_up({email, password, username}) {
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