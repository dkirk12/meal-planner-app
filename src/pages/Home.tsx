import React, { useEffect, useMemo, useState } from 'react'
import type { WeeklyMealPlan } from '../models/types'
import { openDb, seedIfEmpty, getWeeklyPlan, attachAutoPersist, persistDb } from '../db'

const START = '2025-08-18'

export default function Home(){
  const [plan, setPlan] = useState<WeeklyMealPlan | null>(null)
  const [db, setDb] = useState<any>(null)

  useEffect(()=>{
    (async ()=>{
      const db = await openDb()
      seedIfEmpty(db)
      const detach = attachAutoPersist(db)
      setDb(db)
      setPlan(getWeeklyPlan(db, START))
      return () => detach()
    })()
  }, [])

  const days = useMemo(()=> plan ? Object.entries(plan.days) : [], [plan])

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24">
      <div className="mb-1 text-3xl font-extrabold tracking-tight">Weekly Meal Plan</div>
      <div className="text-gray-500 mb-6">Week of August 18, 2025 • Local storage backed</div>

      <div className="flex gap-3 mb-4">
        <button
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow"
          onClick={()=>{ if(db) { persistDb(db); alert('Saved to localStorage'); } }}
        >
          Save Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {days.map(([day, data])=> (
          <div key={day} className="bg-white rounded-2xl shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold">{day}</div>
            </div>
            {(['Breakfast','Lunch','Dinner','Dessert'] as const).map(mt => (
              <div key={mt} className="flex gap-3 py-2 border-t first:border-t-0 border-gray-200">
                <div className="w-28 text-gray-500 font-semibold">{mt}</div>
                <div className="flex-1">{(data as any)[mt]?.name ?? '—'}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
