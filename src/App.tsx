import React, { useEffect, useMemo, useState } from 'react'
import quotesList from './data/ofog-quotes.json'

type Quote = {
  id: number
  quote: string
  author: string
  tags: string[]
  translated?: string
  language?: string
  userTranslations?: string[]
}

// 预设翻译数据
const PRESET_TRANSLATIONS: {[key: number]: string} = {
  1: "想象在被打了一巴掌后仍然微笑。然后想象一天二十四小时都这样做。",
  2: "如果外物使你心烦，那痛苦并非由事物本身引起，而是由你对它的评估；而你随时有权撤回这种评估。",
  3: "永远不要让未来打扰你。若有必要，你将以今天用来对抗当下的同样理性武器去面对未来。",
  4: "心灵的力量是不可征服的。",
  5: "战士应该默默承受痛苦。",
  6: "直到我们开始没有它们时，我们才意识到许多东西是多么不必要。我们之所以使用它们，不是因为需要，而是因为我们拥有它们。",
};

function App(){
  const [view, setView] = useState<'random' | 'all'>('random')
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null)
  const [query, setQuery] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [favorites, setFavorites] = useState<number[]>(() => {
    try{ const s = localStorage.getItem('ofog_favs'); return s ? JSON.parse(s) : [] }catch{ return [] }
  })
  // showTranslation 已改为 per-quote 展开状态 expandedTranslations
  const [preferredLanguage, setPreferredLanguage] = useState<'original' | 'translated'>(() => {
    try { const s = localStorage.getItem('ofog_preferred_language'); return s === 'translated' ? 'translated' : 'original' } catch { return 'original' }
  })
  const [expandedTranslations, setExpandedTranslations] = useState<{[key: number]: boolean}>({})
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [quotesData, setQuotesData] = useState<Quote[]>(quotesList)
  const [showContributionModal, setShowContributionModal] = useState(false)
  const [contributionQuoteId, setContributionQuoteId] = useState<number | null>(null)
  const [contributionText, setContributionText] = useState('')
  const [userTranslations, setUserTranslations] = useState<{[key: number]: string[]}>(() => {
    try{ const s = localStorage.getItem('ofog_user_translations'); return s ? JSON.parse(s) : {} }catch{ return {} }
  })
  const [submissionStatus, setSubmissionStatus] = useState<'idle'|'pending'|'success'|'error'>('idle')
  const [submissionMessage, setSubmissionMessage] = useState('')

  const closeContributionModal = () => {
    setShowContributionModal(false)
    setContributionText('')
    setContributionQuoteId(null)
    setSubmissionStatus('idle')
    setSubmissionMessage('')
  }

  const ITEMS_PER_PAGE = 10

  // 初始化随机名言
  useEffect(() => {
    if (quotesData.length > 0) {
      pickRandomQuote()
    }
  }, [quotesData.length])

  useEffect(() => {
    localStorage.setItem('ofog_favs', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('ofog_user_translations', JSON.stringify(userTranslations))
  }, [userTranslations])

  useEffect(() => {
    localStorage.setItem('ofog_preferred_language', preferredLanguage)
  }, [preferredLanguage])

  // 当全局切换到译文时，在随机模式确保当前条目展开以显示译文
  useEffect(() => {
    if (view === 'random' && randomQuote) {
      if (preferredLanguage === 'translated') {
        setExpandedTranslations(prev => ({ ...prev, [randomQuote.id]: true }))
      }
    }
  }, [preferredLanguage, view, randomQuote])

  const authors = useMemo(()=>{
    const set = new Set<string>()
    quotesData.forEach(q=>set.add(q.author.replace(/,$/,'').trim()))
    return Array.from(set).sort()
  },[quotesData])

  const filtered = quotesData.filter(q=>{
    // 如果开启仅显示收藏，先过滤掉非收藏项
    if (showOnlyFavorites && !favorites.includes(q.id)) return false

    const text = (q.quote + ' ' + q.author + ' ' + (q.tags||[]).join(' ')).toLowerCase()
    if(query && !text.includes(query.toLowerCase())) return false
    if(authorFilter && q.author.replace(/,$/,'').trim() !== authorFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedQuotes = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  function pickRandomQuote(){
    if(quotesData.length === 0) return
    const randomIdx = Math.floor(Math.random() * quotesData.length)
    const newQuote = quotesData[randomIdx]
    
    // 添加预设翻译
    if (PRESET_TRANSLATIONS[newQuote.id]) {
      newQuote.translated = PRESET_TRANSLATIONS[newQuote.id]
    }
    
    setRandomQuote(newQuote)
  }

  function toggleFav(id:number){
    setFavorites(f => f.includes(id) ? f.filter(x=>x!==id) : [...f, id])
  }

  function exportJSON(){
    const payload = JSON.stringify(quotesData.filter(q=>favorites.includes(q.id)), null, 2)
    const blob = new Blob([payload], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ofog-favorites.json'; a.click(); URL.revokeObjectURL(url)
  }

  function exportMD(){
    const lines = quotesData.filter(q=>favorites.includes(q.id)).map(q=>`- "${q.quote.replace(/"/g,'\"')}" — ${q.author}`)
    const blob = new Blob([lines.join('\n')], {type:'text/markdown'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ofog-favorites.md'; a.click(); URL.revokeObjectURL(url)
  }

  // 获取翻译文本（优先预设翻译，再看用户提交的翻译）
  const getTranslation = (quote: Quote) => {
    if (PRESET_TRANSLATIONS[quote.id]) {
      return PRESET_TRANSLATIONS[quote.id]
    }
    const uts = userTranslations[quote.id]
    if (uts && uts.length > 0) return uts[uts.length - 1]
    return null
  }

  // 获取用户翻译
  const getUserTranslations = (quoteId: number) => {
    return userTranslations[quoteId] || []
  }

  // 打开贡献翻译对话框（如果已有翻译，把当前翻译带入输入框供修改）
  const openContributionModal = (quoteId: number) => {
    setContributionQuoteId(quoteId)
    const q = quotesData.find(x => x.id === quoteId)
    const existing = q ? (getTranslation(q) || '') : ''
    setContributionText(existing)
    setShowContributionModal(true)
  }

  // 提交翻译
  const submitTranslation = async () => {
    if (!contributionText.trim() || contributionQuoteId === null) {
      alert('请输入翻译内容')
      return
    }

    // 更新本地用户翻译
    const newUserTranslations = {
      ...userTranslations,
      [contributionQuoteId]: [
        ...(userTranslations[contributionQuoteId] || []),
        contributionText.trim()
      ]
    }
    
    setUserTranslations(newUserTranslations)

    // 发送到后端保存
    try {
      const response = await fetch('http://192.168.0.106:3001/api/quotes/contribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: contributionQuoteId,
          translation: contributionText.trim(),
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        setSubmissionStatus('success')
        setSubmissionMessage('翻译提交成功！感谢你的贡献！')
      } else {
        setSubmissionStatus('error')
        setSubmissionMessage('后端保存失败，但本地已更新')
      }
    } catch (error) {
      setSubmissionStatus('error')
      setSubmissionMessage('无法连接到后端，但本地已更新')
    }

    // 显示成功/失败提示，并在短暂延迟后自动关闭模态框
    setTimeout(() => {
      closeContributionModal()
    }, 1400)
  }

  // 切换单个项目的翻译显示
  const toggleTranslationVisibility = (quoteId: number) => {
    setExpandedTranslations(prev => ({
      ...prev,
      [quoteId]: !prev[quoteId]
    }))
  }

  // 根据首选语言和翻译显示状态，决定显示的文本
  const getDisplayText = (quote: Quote, isExpanded: boolean) => {
    const translation = getTranslation(quote)
    
    if (preferredLanguage === 'translated') {
      return translation || quote.quote
    }
    
    // preferredLanguage === 'original'
    if (isExpanded && translation) {
      return translation
    }
    
    return quote.quote
  }

  const shouldShowTranslationButton = (quote: Quote) => {
    return !!getTranslation(quote)
  }

  const contributionQuote = contributionQuoteId !== null ? quotesData.find(q => q.id === contributionQuoteId) : null

  return (
    <div className="app">
      <header className="header">
        <h1>Daily Quotes<span className="subtitle">——每日格言</span></h1>
        <div className="view-tabs">
          <button 
            className={`tab ${view === 'random' ? 'active' : ''}`}
            onClick={() => { setView('random'); setCurrentPage(1) }}
          >
            随机模式
          </button>
          <button 
            className={`tab ${view === 'all' ? 'active' : ''}`}
            onClick={() => { setView('all'); setCurrentPage(1) }}
          >
            列表模式
          </button>
          <button 
            className="lang-toggle"
            onClick={() => setPreferredLanguage(p => p === 'original' ? 'translated' : 'original')}
          >
            {preferredLanguage === 'original' ? '切换到译文' : '切换到原文'}
          </button>
        </div>
      </header>

      <main>
        {view === 'random' ? (
          <div className="random-view">
            {randomQuote && (
              <div className={`quote-card ${favorites.includes(randomQuote.id)?'fav':''}`}>
                {/* 在随机模式也使用 per-quote 展开状态 */}
                {(() => {
                  const isExpanded = expandedTranslations[randomQuote.id] || false
                  return (
                    <>
                      <p className="quote">{getDisplayText(randomQuote, isExpanded)}</p>

                      {isExpanded && getTranslation(randomQuote) && (
                        <p className="translation">{getTranslation(randomQuote)}</p>
                      )}

                      {/* 显示用户翻译 */}
                      {getUserTranslations(randomQuote.id).length > 0 && (
                        <div className="user-translations">
                          <p className="user-translations-title">用户翻译：</p>
                          {getUserTranslations(randomQuote.id).map((ut, idx) => (
                            <p key={idx} className="user-translation-item">{ut}</p>
                          ))}
                        </div>
                      )}

                      <p className="author">— {randomQuote.author.replace(/,$/,'')}</p>
                      <div className="meta">
                        <div className="tags">{(randomQuote.tags||[]).join(', ')}</div>
                        <div className="actions">
                          {shouldShowTranslationButton(randomQuote) && (
                            <button 
                              onClick={() => toggleTranslationVisibility(randomQuote.id)}
                              className="btn-translate"
                            >
                              {(expandedTranslations[randomQuote.id] || false) ? '隐藏译文' : '中英对照'}
                            </button>
                          )}
                          <button 
                            onClick={() => openContributionModal(randomQuote.id)}
                            className="btn-contribute"
                          >
                            + 补充翻译
                          </button>
                          <button onClick={()=>toggleFav(randomQuote.id)} className="btn-fav">
                            {favorites.includes(randomQuote.id)?'★ 已收藏':'☆ 收藏'}
                          </button>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
            <button className="next-btn" onClick={() => pickRandomQuote()}>
              下一个 →
            </button>
          </div>
        ) : (
          <div className="all-view">
            <div className="controls">
              <input 
                placeholder="搜索名言、作者、标签" 
                value={query} 
                onChange={e=>setQuery(e.target.value)} 
              />
              <select value={authorFilter} onChange={e=>setAuthorFilter(e.target.value)}>
                <option value="">所有作者</option>
                {authors.map(a=> <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="toolbar">
              <button onClick={()=>setFavorites([])}>清除收藏</button>
              <button onClick={exportJSON}>导出 JSON</button>
              <button onClick={exportMD}>导出 MD</button>
              <button 
                className={`btn-filter-favs ${showOnlyFavorites ? 'active' : ''}`}
                onClick={() => setShowOnlyFavorites(s => !s)}
              >
                {showOnlyFavorites ? '显示全部' : '仅显示收藏'}
              </button>
            </div>

            <ul className="quotes">
              {paginatedQuotes.map(q=> {
                const isTranslationExpanded = expandedTranslations[q.id] || false
                const translation = getTranslation(q)
                
                return (
                  <li key={q.id} className={favorites.includes(q.id)?'fav':''}>
                    {/* 列表模式：上面始终显示英文原文；展开或全局偏好为译文时显示下面的中文译文，便于对照 */}
                    <p className="quote">{q.quote}</p>
                    
                    {((isTranslationExpanded || preferredLanguage === 'translated') && translation) && (
                      <p className="translation">{translation}</p>
                    )}

                    {/* 显示用户翻译 */}
                    {getUserTranslations(q.id).length > 0 && (
                      <div className="user-translations">
                        <p className="user-translations-title">用户翻译：</p>
                        {getUserTranslations(q.id).map((ut, idx) => (
                          <p key={idx} className="user-translation-item">{ut}</p>
                        ))}
                      </div>
                    )}
                    
                    <p className="author">— {q.author.replace(/,$/,'')}</p>
                    <div className="meta">
                      <div className="tags">{(q.tags||[]).join(', ')}</div>
                      <div className="actions">
                        {translation && (
                          <button 
                            onClick={() => toggleTranslationVisibility(q.id)}
                            className="btn-translate"
                          >
                            {isTranslationExpanded ? '隐藏译文' : '中英对照'}
                          </button>
                        )}
                        <button 
                          onClick={() => openContributionModal(q.id)}
                          className="btn-contribute"
                        >
                          + 补充翻译
                        </button>
                        <button 
                          onClick={()=>toggleFav(q.id)}
                          className="btn-fav"
                        >
                          {favorites.includes(q.id)?'★':'☆'}
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="pagination">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ← 上一页
              </button>
              <span className="page-info">
                第 {currentPage} 页，共 {totalPages} 页 ({filtered.length} 条结果)
              </span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                下一页 →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 补充翻译模态框 */}
      {showContributionModal && (
        <div className="modal-overlay" onClick={() => setShowContributionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>补充翻译</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowContributionModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-quote">
                "{contributionQuote?.quote}"
              </p>
              <p className="modal-author">— {contributionQuote?.author.replace(/,$/,'')}</p>
              <textarea
                className="modal-textarea"
                placeholder="请输入你的翻译版本..."
                value={contributionText}
                onChange={(e) => setContributionText(e.target.value)}
                rows={5}
              />
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowContributionModal(false)}
              >
                取消
              </button>
              <button 
                className="btn-submit"
                onClick={submitTranslation}
              >
                提交翻译
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>
        <small>{favorites.length} 个收藏</small>
      </footer>
    </div>
  )
}

export default App
