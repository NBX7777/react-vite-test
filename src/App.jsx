import { useState } from 'react'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [submitStatus, setSubmitStatus] = useState(null) // null, 'success', 'error'

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 簡單的驗證
    if (!formData.name || !formData.phone || !formData.email) {
      setSubmitStatus('error')
      return
    }

    // 模擬API調用
    try {
      // 這裡可以替換為實際的API調用
      await new Promise(resolve => setTimeout(resolve, 1000)) // 模擬網路延遲
      
      console.log('表單數據:', formData)
      setSubmitStatus('success')
      
      // 清空表單
      setFormData({
        name: '',
        phone: '',
        email: ''
      })
    } catch (error) {
      setSubmitStatus('error')
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
          />
        </div>

        <button type="submit" className="submit-btn">
          送出
        </button>
      </form>

      {/* 顯示提交結果 */}
      {submitStatus === 'success' && (
        <div className="message success">
          ✅ 表單提交成功！
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="message error">
          ❌ 提交失敗，請檢查所有欄位是否已填寫。
        </div>
      )}
    </div>
  )
}

export default App
