// Source type metadata (by source_type, for backward compatibility)
export const SOURCE_META = {
  'Instagram Extract':    { icon: '📸', label: 'Instagram' },
  'Instagram Extraction': { icon: '📸', label: 'Instagram' }, // legacy label
  'Web Import':           { icon: '🌐', label: 'Web'       },
  'PDF Import':           { icon: '📄', label: 'PDF'       },
  'Image Import':         { icon: '📷', label: 'Photo'     },
  'Text Import':          { icon: '📝', label: 'Text'      },
}

// Brand metadata (by source_brand for detailed display)
export const BRAND_META = {
  'Instagram': {
    icon: '📸',
    label: 'Instagram',
    badge: 'bg-purple-100 text-purple-800 border border-purple-200',
  },
  'Serious Eats': {
    icon: '🍳',
    label: 'Serious Eats',
    badge: 'bg-orange-100 text-orange-800 border border-orange-200',
  },
  'AllRecipes': {
    icon: '👨‍🍳',
    label: 'AllRecipes',
    badge: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  'NYT Cooking': {
    icon: '📰',
    label: 'NYT Cooking',
    badge: 'bg-gray-100 text-gray-900 border border-gray-300',
  },
  'Bon Appétit': {
    icon: '✨',
    label: 'Bon Appétit',
    badge: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  'Epicurious': {
    icon: '✨',
    label: 'Epicurious',
    badge: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  'Unknown': {
    icon: '📋',
    label: 'Unknown Source',
    badge: 'bg-gray-100 text-gray-600 border border-gray-300',
  },
}
