import React from 'react'

export function TabBar({ active, onChange }: { active: 'home'|'recipes', onChange: (t:'home'|'recipes')=>void }){
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur border-t border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-around">
        <button
          className={`px-4 py-2 rounded-xl font-semibold ${active==='home'?'text-blue-600 bg-blue-50':'text-gray-600'}`}
          onClick={()=>onChange('home')}
        >
          Home
        </button>
        <button
          className={`px-4 py-2 rounded-xl font-semibold ${active==='recipes'?'text-blue-600 bg-blue-50':'text-gray-600'}`}
          onClick={()=>onChange('recipes')}
        >
          Recipes
        </button>
      </div>
    </div>
  )
}
