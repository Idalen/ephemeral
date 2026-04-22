import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { uploadMedia } from '../api/media'
import { createPost } from '../api/posts'
import { Input, Textarea } from '../components/ui/Input'

interface UploadedImage {
  key: string
  file: File
  previewUrl: string
  mediaId?: string
  uploading: boolean
  error?: string
}

export default function NewPost() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [images, setImages] = useState<UploadedImage[]>([])
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [showGps, setShowGps] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submitMutation = useMutation({
    mutationFn: () =>
      createPost({
        city,
        country,
        description: description || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        media_ids: images.map((i) => i.mediaId!),
      }),
    onSuccess: (res) => {
      toast.success('Post created.')
      qc.invalidateQueries({ queryKey: ['feed'] })
      navigate(`/posts/${res.data.id}`)
    },
    onError: () => toast.error('Could not create post.'),
  })

  function addFiles(files: FileList) {
    const remaining = 10 - images.length
    const selected = Array.from(files).slice(0, remaining)
    if (!selected.length) return

    const newImages: UploadedImage[] = selected.map((file) => ({
      key: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
    }))

    setImages((prev) => [...prev, ...newImages])

    newImages.forEach((img) => {
      const fd = new FormData()
      fd.append('file', img.file)
      uploadMedia(fd)
        .then((res) => {
          setImages((prev) =>
            prev.map((i) => (i.key === img.key ? { ...i, mediaId: res.data.id, uploading: false } : i)),
          )
        })
        .catch(() => {
          setImages((prev) =>
            prev.map((i) =>
              i.key === img.key ? { ...i, uploading: false, error: 'Upload failed' } : i,
            ),
          )
        })
    })
  }

  function removeImage(key: string) {
    setImages((prev) => prev.filter((i) => i.key !== key))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (images.length === 0) e.images = 'Add at least one image.'
    if (images.some((i) => i.uploading)) e.images = 'Wait for uploads to finish.'
    if (images.some((i) => i.error)) e.images = 'Remove failed uploads.'
    if (!city.trim()) e.city = 'City is required.'
    if (!country.trim()) e.country = 'Country is required.'
    if (showGps && latitude && (parseFloat(latitude) < -90 || parseFloat(latitude) > 90))
      e.latitude = 'Must be between −90 and 90.'
    if (showGps && longitude && (parseFloat(longitude) < -180 || parseFloat(longitude) > 180))
      e.longitude = 'Must be between −180 and 180.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    submitMutation.mutate()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  const canSubmit =
    images.length > 0 &&
    images.every((i) => !i.uploading && !i.error) &&
    city.trim() &&
    country.trim() &&
    !submitMutation.isPending

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: '300',
          fontStyle: 'italic',
          fontSize: '1.6rem',
          color: 'var(--color-text)',
          margin: '0 0 2rem',
        }}
      >
        New post
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Drop zone */}
        <div>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `1px dashed ${errors.images ? '#c0392b' : 'var(--color-border)'}`,
              borderRadius: '3px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'var(--color-muted)',
              transition: 'border-color 0.2s ease',
            }}
          >
            <ImagePlus size={22} strokeWidth={1.2} style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>
              Drag images here or click to select
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
              Up to {10 - images.length} more · image files only
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files) addFiles(e.target.files) }}
          />
          {errors.images && (
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: '#c0392b' }}>{errors.images}</p>
          )}
        </div>

        {/* Previews */}
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {images.map((img) => (
              <div
                key={img.key}
                style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '3px', overflow: 'hidden', background: 'var(--color-border)', border: img.error ? '1px solid #c0392b' : 'none' }}
              >
                <img
                  src={img.previewUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {img.uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={16} strokeWidth={1.5} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.key)}
                  style={{
                    position: 'absolute',
                    top: '3px',
                    right: '3px',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <X size={10} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input
            label="City *"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            error={errors.city}
            placeholder="Tokyo"
          />
          <Input
            label="Country *"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            error={errors.country}
            placeholder="Japan"
          />
        </div>

        {/* Description */}
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional — describe the place"
          style={{ minHeight: '70px' }}
        />

        {/* GPS toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowGps((v) => !v)}
            style={{
              fontSize: '0.66rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
          >
            {showGps ? '− Hide GPS coordinates' : '+ Add GPS coordinates'}
          </button>

          {showGps && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              <Input
                label="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                error={errors.latitude}
                placeholder="35.6762"
                type="number"
                step="any"
              />
              <Input
                label="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                error={errors.longitude}
                placeholder="139.6503"
                type="number"
                step="any"
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: '0.75rem',
            background: 'var(--color-text)',
            color: 'var(--color-inv)',
            border: 'none',
            borderRadius: '3px',
            fontSize: '0.68rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.5,
            transition: 'opacity 0.2s ease',
          }}
        >
          {submitMutation.isPending ? 'Publishing…' : 'Publish'}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
