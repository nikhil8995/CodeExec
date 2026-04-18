import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../hooks/useApi'
import Badge from '../components/ui/Badge'

export default function QuestionSubmissions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [subs, setSubs] = useState([])
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/questions/${id}/submissions`),
      api.get(`/questions/${id}`)
    ]).then(([s, q]) => {
      setSubs(s.data)
      setQuestion(q.data)
    })
  }, [id])

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 56px)' }}>

      {/* LEFT PANEL */}
      <div className="w-72 border-r border-dark-500 bg-dark-800 flex flex-col">
        <div className="p-4 border-b border-dark-500">
          <button onClick={() => navigate('/my-questions')} className="text-xs text-slate-400 mb-2">
            ← Back
          </button>
          <h2 className="text-white font-bold">{question?.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {subs.map(sub => {
            const isSelected = selected?.id === sub.id

            return (
              <button
                key={sub.id}
                onClick={() => setSelected(sub)}
                className={`w-full text-left p-3 border-b border-dark-600 transition-all
                  ${isSelected ? 'bg-dark-600 border-l-4 border-brand-500' : 'hover:bg-dark-700'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-200">{sub.user?.name}</span>
                  <Badge label={sub.status} />
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(sub.createdAt).toLocaleString()}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-6 overflow-y-auto bg-dark-900">
        {!selected ? (
          <p className="text-slate-500">Select a submission</p>
        ) : (
          <>
            <h2 className="text-white text-lg font-bold">{selected.user?.name}</h2>
            <p className="text-slate-400 text-sm">{selected.user?.email}</p>

            <p className="text-xs text-slate-500 mt-1">
              Submission #{selected.id}
            </p>

            <div className="mt-4">
              <h3 className="text-xs text-slate-500 mb-1">Output</h3>
              <pre className="bg-black p-3 rounded text-green-400">
                {selected.output}
              </pre>
            </div>

            <div className="mt-4">
              <h3 className="text-xs text-slate-500 mb-1">Code</h3>
              <pre className="bg-black p-3 rounded text-white overflow-auto max-h-[60vh]">
                {selected.code}
              </pre>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
