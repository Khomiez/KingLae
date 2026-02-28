import { createServerClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import SOSAssessmentClient from './SOSAssessmentClient'

interface PageProps {
  params: Promise<{ eventId: string }>
}

async function getEventWithPatient(eventId: string) {
  const supabase = createServerClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      devices(
        mac_address,
        state,
        battery_level,
        health,
        patients(
          id,
          name,
          date_of_birth,
          weight,
          height,
          symptoms,
          address,
          relative_line_id
        )
      )
    `)
    .eq('id', eventId)
    .single()

  if (error || !event) {
    return null
  }

  return event
}

function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export default async function SOSAssessmentPage({ params }: PageProps) {
  const { eventId } = await params
  const event = await getEventWithPatient(eventId)

  if (!event) {
    notFound()
  }

  // Validate event type - only SOS events should be assessed here
  if (event.event_type !== 'SOS') {
    redirect('/caregiver/home?error=invalid_event_type')
  }

  // Check if event is already triaged
  if (event.triage_decision) {
    // If already triaged as TRUE_SOS and completed, redirect to home
    if (event.triage_decision === 'TRUE_SOS' && event.status === 'COMPLETED') {
      redirect('/caregiver/home?message=event_already_completed')
    }
    // If downgraded to ASSIST, redirect to to-confirm page
    if (event.triage_decision === 'DOWNGRADED_TO_ASSIST') {
      redirect(`/caregiver/to-confirm?eventId=${eventId}`)
    }
  }

  // Check event status - must be ACKNOWLEDGED
  if (event.status !== 'ACKNOWLEDGED') {
    redirect('/caregiver/home?error=event_not_acknowledged')
  }

  const patient = event.devices?.patients
  const device = event.devices
  const age = calculateAge(patient?.date_of_birth ?? null)

  return (
    <SOSAssessmentClient
      eventId={eventId}
      event={event}
      patient={patient}
      device={device}
      age={age}
      eventCreatedAt={event.created_at}
    />
  )
}
