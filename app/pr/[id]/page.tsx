export default function PRDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">PR Detail: {params.id}</h1>
      <p className="text-muted-foreground mt-2">PR detail + analysis will be implemented in Module 10.</p>
    </main>
  )
}
