/**
 * This is a user authentication API route.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { db } from '../db/index.js'

const router = Router()

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  await db.read()
  const { username, password } = req.body
  
  const user = db.data.users.find(
    (u) => u.username === username && u.password === password
  )
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: '用户名或密码错误',
    })
    return
  }
  
  const { password: _, ...userWithoutPassword } = user
  
  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token: `token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    },
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: '登出成功',
  })
})

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  await db.read()
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: '未登录',
    })
    return
  }
  
  const user = db.data.users[0]
  const { password: _, ...userWithoutPassword } = user
  
  res.json({
    success: true,
    data: userWithoutPassword,
  })
})

export default router
