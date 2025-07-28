// Date formatters
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return format.replace('DD', day).replace('MM', month).replace('YYYY', year)
}

export const formatTime = (time) => {
  if (!time) return ''
  return new Date(`2000-01-01 ${time}`).toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit'
  })
}

// Validation rules
export const rules = {
  required: { required: true, message: 'Bu alan zorunludur' },
  email: { type: 'email', message: 'Geçerli email giriniz' },
  flightNumber: {
    pattern: /^[A-Z]{2}\d{1,4}$/,
    message: 'Uçuş numarası AA9999 formatında olmalı'
  },
  icaoCode: {
    pattern: /^[A-Z]{4}$/,
    message: 'ICAO kodu 4 harf olmalı'
  },
  iataCode: {
    pattern: /^[A-Z]{2,3}$/,
    message: 'IATA kodu 2-3 harf olmalı'
  }
}

// Debounce function
export const debounce = (fn, delay = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Loading state manager
export const useLoading = () => {
  const loading = ref(false)

  const withLoading = async (fn) => {
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  return { loading, withLoading }
}

// Pagination helper
export const usePagination = (fetchFn) => {
  const data = ref([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  const fetch = async () => {
    loading.value = true
    try {
      const response = await fetchFn({
        page: currentPage.value - 1,
        size: pageSize.value
      })
      data.value = response.content
      total.value = response.totalElements
    } finally {
      loading.value = false
    }
  }

  const changePage = (page) => {
    currentPage.value = page
    fetch()
  }

  return { data, loading, total, currentPage, pageSize, fetch, changePage }
}
