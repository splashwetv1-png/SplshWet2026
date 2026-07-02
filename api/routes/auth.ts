import { Router, type Request, type Response } from 'express'
import { loginAdmin, loginUser, registerUser } from '../services/auth-service.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    const payload = await registerUser(username, password)

    res.status(201).json({
      success: true,
      ...payload,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'registration failed',
    })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    const payload = await loginUser(username, password)

    res.status(200).json({
      success: true,
      ...payload,
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'login failed',
    })
  }
})

router.post('/admin/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    const payload = await loginAdmin(username, password)

    res.status(200).json({
      success: true,
      ...payload,
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'admin login failed',
    })
  }
})

export default router
