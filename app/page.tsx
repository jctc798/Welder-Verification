'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// This tells the app to use the secret keys you will put into Vercel later
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

type Welder = {
  id: string
  full_name: string
  ua_card_number: string
}

type Instructor = {
  id: string
  name: string
}

type QualificationOption = {
  id: string
  label: string
}

type VerificationRecord = {
  id: string
  welder_name: string
  ua_card_number: string
  instructor_name: string
  process_combo: string
  status: string
  created_at: string
}

export default function WelderApp() {
  const [welders, setWelders] = useState<Welder[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [qualOptions, setQualOptions] = useState<QualificationOption[]>([])
  const [verifications, setVerifications] = useState<VerificationRecord[]>([])

  const [search, setSearch] = useState('')
  const [selectedWelder, setSelectedWelder] = useState<Welder | null>(null)

  const [newWelderName, setNewWelderName] = useState('')
  const [newUaNumber, setNewUaNumber] = useState('')

  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [selectedQual, setSelectedQual] = useState('')
  const [status, setStatus] = useState('Pass')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: w } = await supabase.from('welders').select('*')
    const { data: i } = await supabase.from('instructors').select('*')
    const { data: q } = await supabase.from('qualification_options').select('*')
    const { data: v } = await supabase.from('verification_summary').select('*').order('created_at', { ascending: false })

    if (w) setWelders(w)
    if (i) setInstructors(i)
    if (q) setQualOptions(q)
    if (v) setVerifications(v)
  }

  const filteredWelders = useMemo(() => {
    return welders.filter(w => 
      w.full_name.toLowerCase().includes(search.toLowerCase()) || 
      w.ua_card_number.toLowerCase().includes(search.toLowerCase())
    )
  }, [welders, search])

  async function handleAddWelder(e: FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase
      .from('welders')
      .insert([{ full_name: newWelderName, ua_card_number: newUaNumber }])
      .select()
    
    if (data) {
      setWelders([...welders, data[0]])
      setSelectedWelder(data[0])
      setNewWelderName('')
      setNewUaNumber('')
    }
  }

  async function handleAddVerification(e: FormEvent) {
    e.preventDefault()
    if (!selectedWelder) return

    const { error } = await supabase.from('verification_summary').insert([{
      welder_name: selectedWelder.full_name,
      ua_card_number: selectedWelder.ua_card_number,
      instructor_name: selectedInstructor,
      process_combo: selectedQual,
      status: status
    }])

    if (!error) {
      loadData()
      setSelectedWelder(null)
      setSelectedInstructor('')
      setSelectedQual('')
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Welder Verification</h1>

      {/* SEARCH & SELECT */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f4f4f4', borderRadius: '8px' }}>
        <h2>Step 1: Find or Add Welder</h2>
        <input 
          placeholder="Search by name or UA#" 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        
        <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'white', border: '1px solid #ccc' }}>
          {filteredWelders.map(w => (
            <div 
              key={w.id} 
              onClick={() => setSelectedWelder(w)}
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', background: selectedWelder?.id === w.id ? '#e0e0e0' : 'transparent' }}
            >
              {w.full_name} ({w.ua_card_number})
            </div>
          ))}
        </div>

        <p>OR Add New:</p>
        <form onSubmit={handleAddWelder}>
          <input placeholder="Full Name" value={newWelderName} onChange={e => setNewWelderName(e.target.value)} style={{ marginRight: '10px', padding: '5px' }} />
          <input placeholder="UA Card #" value={newUaNumber} onChange={e => setNewUaNumber(e.target.value)} style={{ marginRight: '10px', padding: '5px' }} />
          <button type="submit">Add Welder</button>
        </form>
      </section>

      {/* VERIFICATION FORM */}
      {selectedWelder && (
        <section style={{ marginBottom: '40px', padding: '20px', border: '2px solid #007bff', borderRadius: '8px' }}>
          <h2>Step 2: Log Verification for {selectedWelder.full_name}</h2>
          <form onSubmit={handleAddVerification}>
            <div style={{ marginBottom: '10px' }}>
              <label>Instructor: </label>
              <select value={selectedInstructor} onChange={e => setSelectedInstructor(e.target.value)} required>
                <option value="">Select Instructor</option>
                {instructors.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Qualification: </label>
              <select value={selectedQual} onChange={e => setSelectedQual(e.target.value)} required>
                <option value="">Select Process</option>
                {qualOptions.map(q => <option key={q.id} value={q.label}>{q.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Result: </label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
              Submit Verification
            </button>
          </form>
        </section>
      )}

      {/* HISTORY */}
      <section>
        <h2>Recent Verifications</h2>
        {verifications.map((v) => (
          <div key={v.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '8px', backgroundColor: v.status === 'Pass' ? '#e6ffed' : '#fff5f5' }}>
            <strong>{v.welder_name}</strong> ({v.ua_card_number})<br />
            Process: {v.process_combo} | Instructor: {v.instructor_name}<br />
            Status: <span style={{ fontWeight: 'bold', color: v.status === 'Pass' ? 'green' : 'red' }}>{v.status}</span><br />
            <small>{new Date(v.created_at).toLocaleDateString()}</small>
          </div>
        ))}
      </section>
    </div>
  )
}
