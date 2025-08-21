import React, { useEffect, useMemo, useState } from 'react'
import type { WeeklyMealPlanRef, DayOfWeek, MealType } from '../models/plan'
import { createEmptyPlan, loadPlan, savePlan } from '../models/plan'
import { openRecipesDb, persistRecipesDb, getAllRecipes, type RecipeRow } from '../db/recipesDb'

const START = '2025-08-18'

export default function Home(){
  const [plan, setPlan] = useState<WeeklyMealPlanRef | null>(null)
  const [recipesDb, setRecipesDb] = useState<any>(null)
  const [recipes, setRecipes] = useState<RecipeRow[]>([])

  useEffect(()=>{
    (async ()=>{
      const db = await openRecipesDb()
      setRecipesDb(db)
      setRecipes(getAllRecipes(db, 'name_asc'))
      let p = loadPlan(START)
      if(!p){ p = createEmptyPlan(START); savePlan(p) }
      setPlan(p)
      window.addEventListener('beforeunload', ()=>{ if(db) persistRecipesDb(db) })
    })()
  }, [])

  const days = useMemo(()=> plan ? (Object.keys(plan.days) as DayOfWeek[]) : [], [plan])

  function setMeal(day: DayOfWeek, mt: MealType, recipeId: string){
    if(!plan) return
    const next = JSON.parse(JSON.stringify(plan)) as WeeklyMealPlanRef
    next.days[day][mt] = recipeId
    setPlan(next)
    savePlan(next)
  }

  function nameFor(recipeId?: string){
    if(!recipeId) return '—'
    const r = recipes.find(x => x.id === recipeId)
    return r ? r.name : 'Unknown recipe'
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24">
      <div className="mb-1 text-3xl font-extrabold tracking-tight">Weekly Meal Plan</div>
      <div className="text-gray-500 mb-6">Week of August 18, 2025 • Plan references recipes DB</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {days.map((day)=> (
          <div key={day} className="bg-white rounded-2xl shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold">{day}</div>
            </div>
            {(['Breakfast','Lunch','Dinner','Dessert'] as MealType[]).map(mt => (
              <div key={mt} className="flex gap-3 py-2 border-t first:border-t-0 border-gray-200 items-center">
                <div className="w-28 text-gray-500 font-semibold">{mt}</div>
                <div className="flex-1">{nameFor(plan?.days[day][mt])}</div>
                <select
                  className="border border-gray-200 rounded-xl px-2 py-1"
                  value={plan?.days[day][mt] ?? ''}
                  onChange={e=> setMeal(day, mt, e.target.value)}
                >
                  <option value="">—</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
