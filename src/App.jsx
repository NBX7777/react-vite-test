import { useState } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [submitStatus, setSubmitStatus] = useState(null) // null, 'success', 'error'
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setSubmitStatus(null)
    
    // 簡單的驗證
    if (!formData.name || !formData.phone || !formData.email) {
      setSubmitStatus('error')
      setIsLoading(false)
      return
    }

    try {
      // 插入數據到Supabase
      const { data, error } = await supabase
        .from('contacts')
        .insert([
          {
            name: formData.name,
            phone: formData.phone,
            email: formData.email
          }
        ])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        setSubmitStatus('error')
      } else {
        console.log('數據已保存:', data)
        setSubmitStatus('success')
        
        // 清空表單
        setFormData({
          name: '',
          phone: '',
          email: ''
        })
      }
    } catch (error) {
      console.error('提交錯誤:', error)
      setSubmitStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container">
      <h1>聯絡表單</h1>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name">姓名：</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="請輸入您的姓名"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">電話：</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="請輸入您的電話號碼"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email：</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="請輸入您的Email"
            required
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isLoading}
        >
          {isLoading ? '提交中...' : '送出'}
        </button>
      </form>

      {/* 顯示提交結果 */}
      {submitStatus === 'success' && (
        <div className="message success">
          ✅ 表單提交成功！數據已保存到資料庫。
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="message error">
          ❌ 提交失敗，請檢查所有欄位是否已填寫，或稍後再試。
        </div>
      )}
    </div>
  )
}

export default App
