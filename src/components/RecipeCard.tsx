import React from 'react'

export function RecipeCard({ name, subtitle, imageUrl }: { name: string; subtitle?: string; imageUrl?: string }){
  return (
    <div className="bg-white rounded-3xl shadow border border-gray-200 p-4 hover:shadow-md transition">
      <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-gray-100 mb-3">
        {imageUrl
          ? <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />}
      </div>
      <div className="text-lg font-semibold">{name}</div>
      {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
    </div>
  )
}
