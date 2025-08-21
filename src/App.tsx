import React, { useState } from 'react'
import Home from './pages/Home'
import Recipes from './pages/Recipes'
import { TabBar } from './components/TabBar'

export default function App(){
  const [tab, setTab] = useState<'home'|'recipes'>('home')
  return (
    <div className="min-h-screen bg-gray-100">
      {tab === 'home' ? <Home /> : <Recipes />}
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
