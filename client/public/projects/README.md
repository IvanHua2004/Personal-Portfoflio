# Project media

Drop screenshots and clips here, then point at them from
`src/app/data/projects.data.ts`:

    media: { src: 'projects/six-axis.webp', alt: 'The claw tracking a target in RViz' }
    media: { src: 'projects/six-axis.mp4', type: 'video',
             poster: 'projects/six-axis.webp',
             alt: 'The arm following a target dragged around the scene' }

Paths are relative to `public/`, so `projects/x.webp` resolves to `/projects/x.webp`.

Worth getting right:

- **One aspect ratio for all of them.** The rows are 16:10. Mismatched ratios
  are the thing that makes a projects section look thrown together.
- **Video, not GIF,** for the arms. A GIF of an RViz loop is several megabytes;
  the same clip as MP4 or WebM is a few hundred kilobytes. Keep them 3–6s.
- **Crop to the viewport.** No RViz panels, toolbars or menu bars — just the
  scene.
- **Capture on a dark background.** The site is #0d1117 and a white screenshot
  glares. RViz's background colour is configurable.
- **Set a poster for every video.** It's what shows before the clip loads, and
  what visitors who prefer reduced motion see instead.

Until a project has media, the row falls back to a dotted plate, which is a
deliberate placeholder rather than a broken image.
