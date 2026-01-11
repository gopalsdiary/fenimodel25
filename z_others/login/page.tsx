'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Page() {
  const [mobile, setMobile] = useState('')
  const [roll, setRoll] = useState('')
  const [user, setUser] = useState(null)
  const [studentData, setStudentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [todos, setTodos] = useState([])
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUserAndStudentData() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        // Fetch student data based on mobile number in metadata
        if (session.user.user_metadata?.mobile) {
          const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('mobile', session.user.user_metadata.mobile)
            .single()
          
          if (student) {
            setStudentData(student)
            fetchTodos() // Or fetch any student-specific data
          }
        }
      }
      
      setLoading(false)
    }
    
    getUserAndStudentData()
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user
        setUser(currentUser)
        
        if (currentUser?.user_metadata?.mobile) {
          const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('mobile', currentUser.user_metadata.mobile)
            .single()
          
          setStudentData(student)
          
          if (student) {
            fetchTodos() // Or fetch any student-specific data
          }
        } else {
          setStudentData(null)
          setTodos([])
        }
      }
    )
    
    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])
  
  async function fetchTodos() {
    const { data, error } = await supabase.from('todos').select()
    
    if (error) {
      console.error('Error fetching todos:', error)
      return
    }
    
    setTodos(data || [])
  }

  async function handleSignIn(e) {
    e.preventDefault()
    
    setMessage('')
    
    if (!mobile || !roll) {
      setMessage('Please enter both mobile number and roll number')
      return
    }
    
    try {
      // First check if student exists in the database
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('mobile', mobile)
        .eq('roll', roll)
        .single()
      
      if (studentError || !student) {
        throw new Error('Invalid mobile number or roll number')
      }
      
      // If student exists, create a custom session
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email: `${mobile}@example.com`, // Using mobile as part of email
        password: roll // Using roll as password
      })
      
      if (sessionError) {
        // If the user doesn't exist in auth, sign them up first
        if (sessionError.message.includes('Invalid login credentials')) {
          await supabase.auth.signUp({
            email: `${mobile}@example.com`,
            password: roll,
            options: {
              data: {
                mobile: mobile,
                roll: roll,
                // Add any other student metadata you want to store
              }
            }
          })
          
          // Try signing in again
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: `${mobile}@example.com`,
            password: roll
          })
          
          if (retryError) throw retryError
        } else {
          throw sessionError
        }
      }
      
      setStudentData(student)
      router.refresh()
    } catch (error) {
      setMessage(error.message || 'Failed to log in')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setStudentData(null)
    router.refresh()
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow-md">
      {user && studentData ? (
        <div>
          <h1 className="text-2xl font-bold mb-4">Welcome, Student</h1>
          
          <div className="mb-4">
            <p className="mb-1"><strong>Mobile:</strong> {studentData.mobile}</p>
            <p className="mb-3"><strong>Roll Number:</strong> {studentData.roll}</p>
            
            <h2 className="text-xl font-semibold mb-2">Your Todos</h2>
            {todos.length > 0 ? (
              <ul className="list-disc pl-5">
                {todos.map((todo) => (
                  <li key={todo.id} className="mb-1">
                    {todo.title || todo.task || JSON.stringify(todo)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No todos found. Add some to get started!</p>
            )}
          </div>
          
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-4">Student Login</h1>
          
          <form className="space-y-4">
            {message && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
                {message}
              </div>
            )}
            
            <div>
              <label htmlFor="mobile" className="block mb-1 font-medium">
                Mobile Number
              </label>
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label htmlFor="roll" className="block mb-1 font-medium">
                Roll Number
              </label>
              <input
                id="roll"
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            
            <button
              onClick={handleSignIn}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            >
              Sign In
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
