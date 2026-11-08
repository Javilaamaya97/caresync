
import { supabase } from '../lib/supabase'

export interface Task {
  id: string
  family_id: string
  title: string
  description: string | null
  responsible_id: string | null
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  created_by: string | null
  created_at: string
  updated_at: string
}

export type TaskInput = Omit<
  Task,
  'id' | 'created_at' | 'updated_at'
>

export async function getTasks(familyId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', familyId)
    .order('due_date', {
      ascending: true,
      nullsFirst: false,
    })

  if (error) throw error
  return data as Task[]
}

export async function createTask(task: TaskInput) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single()

  if (error) throw error
  return data as Task
}

export async function updateTask(
  id: string,
  changes: Partial<TaskInput>,
) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...changes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}
