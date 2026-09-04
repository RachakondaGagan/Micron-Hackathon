import { createServerClient } from '@/lib/supabase'
import { ReviewerQueueWorkbench } from '@/components/reviewer/ReviewerQueueWorkbench'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function getReviewerData() {
  try {
    const supabase = createServerClient()

    // 1. Fetch materials & plants for mapping
    const [{ data: materials }, { data: plants }] = await Promise.all([
      supabase.from('material_master').select('material_id, material_name'),
      supabase.from('plant_master').select('plant_id, plant_name'),
    ])

    const materialMap = new Map((materials || []).map(m => [m.material_id, m.material_name]))
    const plantMap = new Map((plants || []).map(p => [p.plant_id, p.plant_name]))

    // 2. Fetch PRs with their AI analysis
    const { data: prs, error } = await supabase
      .from('purchase_requisitions')
      .select('*, ai_pr_analysis(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviewer PRs:', error)
      return []
    }

    return (prs || []).map(pr => ({
      ...pr,
      material_name: materialMap.get(pr.material_id) || pr.material_id,
      plant_name: plantMap.get(pr.plant_id) || pr.plant_id,
    }))
  } catch (err) {
    console.error('Reviewer page data fetch error:', err)
    return []
  }
}

export default async function ReviewerPage() {
  const prs = await getReviewerData()

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <ReviewerQueueWorkbench initialPrs={prs} />
    </div>
  )
}
