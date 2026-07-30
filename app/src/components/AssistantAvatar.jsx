const SIZE = {
  sm: { box: 'h-10 w-10 rounded-2xl', svg: 'h-6 w-6' },
  md: { box: 'h-12 w-12 rounded-2xl', svg: 'h-7 w-7' },
  lg: { box: 'h-16 w-16 rounded-[1.75rem]', svg: 'h-9 w-9' }
};

function AssistantAvatar({ size = 'md', className = '' }) {
  const scale = SIZE[size] || SIZE.md;

  return (
    <div className={`grid place-items-center bg-gradient-to-br from-amber-100 via-orange-50 to-teal-50 text-amber-700 shadow-inner ${scale.box} ${className}`.trim()}>
      <svg viewBox="0 0 48 48" fill="none" className={scale.svg} aria-hidden="true">
        <path d="M15 19c0-5 4-9 9-9s9 4 9 9v3H15v-3Z" fill="currentColor" opacity=".15" />
        <circle cx="24" cy="18" r="8" fill="currentColor" opacity=".18" />
        <path d="M24 10c-3.6 0-6.8 2.4-7.7 5.8 2.4-1.5 4.9-2.2 7.7-2.2s5.3.7 7.7 2.2C30.8 12.4 27.6 10 24 10Z" fill="currentColor" />
        <circle cx="24" cy="20" r="6.5" fill="#FFD7B8" />
        <path d="M18.5 18.8c1-3 3.2-5.1 5.5-5.1 2.2 0 4.4 2.1 5.5 5.1-.9-.7-2.7-1.4-5.5-1.4s-4.7.7-5.5 1.4Z" fill="#7C3E18" />
        <path d="M19 30c1.5-2 3.2-3 5-3s3.5 1 5 3l2.4 4.2H16.6L19 30Z" fill="currentColor" opacity=".2" />
        <path d="M34.5 14.5h7v3h-7z" fill="#0F766E" />
        <path d="M39.5 13.5h2v9h-2z" fill="#0F766E" />
        <path d="M10 34.5h28v2.5H10z" fill="#0F766E" opacity=".55" />
        <path d="M12.5 30.5h8.5v3h-8.5z" fill="#F59E0B" opacity=".75" />
      </svg>
    </div>
  );
}

export default AssistantAvatar;
