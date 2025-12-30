import React, { createContext, useState, useEffect, useCallback } from 'react'
import Cookies from 'js-cookie'

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  logout: () => {}
})

export const AuthProvider = ({ children }) => {
  const [user, _setUser] = useState(null)
  const jwt = Cookies.get('jwt_token')

  // Wrapper that keeps localStorage in sync whenever user changes
  const setUser = useCallback((u) => {
    _setUser(u)
    try {
      if (u) localStorage.setItem('user', JSON.stringify(u))
      else localStorage.removeItem('user')
    } catch (err) {
      // ignore localStorage errors
    }
  }, [])

  useEffect(() => {
    const verifyToken = async () => {
      if (!jwt) return;
      try {
        const resp = await fetch("http://localhost:5000/jwt/verify-token", {
          method: "GET",
          headers: { authorization: jwt },
        });
        const res = await resp.json();

        if (resp.ok && res.valid && res.user) {
          setUser({
            email: res.user.email,
            isStudent: res.user.isStudent,
            name: res.user.name
          })
        } else {
          setUser(null)
        }
      } catch (err) {
        setUser(null)
      }
    };
    verifyToken()
  }, [jwt, setUser])

  const logout = () => {
    Cookies.remove('jwt_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
