import React, { useEffect, useState } from 'react'
import { openRecipesDb, getAllRecipes, searchRecipesByName, addRecipe, type RecipeSort } from '../db/recipesDb'
import { RecipeCard } from '../components/RecipeCard'

export default function Recipes(){
  const [db, setDb] = useState<any>(null)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<RecipeSort>('name_asc')
  const [recipes, setRecipes] = useState<any[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', meal_type: 'Dinner' as any })

  useEffect(()=>{
    (async ()=>{
      const db = await openRecipesDb()
      setDb(db)
      setRecipes(getAllRecipes(db, sort))
    })()
  }, [])

  useEffect(()=>{
    if(!db) return
    if(q.trim().length>0){
      setRecipes(searchRecipesByName(db, q.trim()))
    }else{
      setRecipes(getAllRecipes(db, sort))
    }
  }, [q, sort, db])

  return (
    <div className="max-w-6xl mx-auto p-6 pb-24">
      <div className="mb-1 text-3xl font-extrabold tracking-tight">Recipes</div>
      <div className="text-gray-500 mb-4">Master library of every recipe</div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm">
          <span className="text-gray-500">Search</span>
          <input className="outline-none" placeholder="Type to search..." value={q} onChange={e=>setQ(e.target.value)} />
        </div>

        <select className="bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm"
          value={sort} onChange={e=>setSort(e.target.value as any)}>
          <option value="name_asc">Name ↑</option>
          <option value="name_desc">Name ↓</option>
          <option value="recent_added">Recently Added</option>
        </select>

        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow"
          onClick={()=> setAddOpen(true)}>
          + Add Recipe
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map(r => (
          <RecipeCard key={r.id} name={r.name} subtitle={r.meal_type} imageUrl={r.image_url || undefined} />
        ))}
      </div>

      {addOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={()=>setAddOpen(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl p-4 border border-gray-200 shadow" onClick={e=>e.stopPropagation()}>
            <div className="text-lg font-bold mb-3">Add Recipe</div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Name</div>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Meal Type</div>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2" value={form.meal_type} onChange={e=>setForm({...form, meal_type: e.target.value})}>
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                  <option>Dessert</option>
                  <option>Snack</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button className="px-4 py-2 rounded-xl bg-gray-100 text-gray-800" onClick={()=>setAddOpen(false)}>Cancel</button>
              <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
                onClick={()=>{
                  if(!db) return
                  if(!form.name.trim()) return alert('Please enter a name')
                  addRecipe(db, { name: form.name.trim(), meal_type: form.meal_type as any })
                  setAddOpen(false)
                  setQ('') // clear search to see the new item
                  setRecipes(getAllRecipes(db, sort))
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
