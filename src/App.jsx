import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from './supabase'
import TetrisGame from './TetrisGame'
import ContactForm from './ContactForm'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<TetrisGame />} />
          <Route path="/form-test" element={<ContactForm />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
