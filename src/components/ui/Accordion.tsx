import React from 'react'

interface AccordionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function Accordion({ title, defaultOpen = true, children }: AccordionProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className="bg-white rounded border shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 border-b"
      >
        <span className="font-semibold text-left">{title}</span>
        <span className="text-gray-500">{open ? '–' : '+'}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}


