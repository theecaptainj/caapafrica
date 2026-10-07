/**
 * ═══════════════════════════════════════════════════════════════
 * CAAP KENYA — SUPABASE DATA LAYER  (supabase.js)
 * ═══════════════════════════════════════════════════════════════
 *
 * HOW TO SET UP:
 * 1. Supabase Dashboard → Settings → API
 * 2. SUPABASE_URL     = "Project URL"
 * 3. SUPABASE_ANON_KEY = "anon public"
 *
 * Admin writes are protected by RLS policies that check
 * auth.role() = 'authenticated' — the admin logs in via
 * Supabase Auth (email + password) and the session is
 * stored in the anon client automatically.
 * ═══════════════════════════════════════════════════════════════
 */

const SUPABASE_URL      = 'https://xfjgexilzjawjecxyetx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmamdleGlsemphd2plY3h5ZXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjc4MDMsImV4cCI6MjA5MTg0MzgwM30.bv6AxRpRLeewdXuqyF09ptvEjwSbdIXx-TRgFOnfWMk';
const STORAGE_BUCKET    = 'caap-images';
const CONTENT_KEY       = 'caap_site_content';

let _supabase  = null;
let _connected = false;

function _credentialsSet() {
  return (
    SUPABASE_URL      !== 'https://YOUR_PROJECT_ID.supabase.co' &&
    SUPABASE_ANON_KEY !== 'YOUR_ANON_PUBLIC_KEY' &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_ANON_KEY.length > 20
  );
}

// Single client — anon key; session is upgraded to 'authenticated'
// automatically when the admin signs in via Supabase Auth.
function _db() { return _supabase; }

function _tryInit() {
  if (_connected) return true;
  try {
    if (typeof window.supabase !== 'undefined' && _credentialsSet()) {
      _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'caap-anon' }
      });
      window._supabase = _supabase; // expose for direct auth calls (e.g. updateUser)
      _connected = true;
      console.log('[CAAP] ✅ Supabase ready.');
      return true;
    }
  } catch (e) { console.error('[CAAP] Supabase init failed:', e); }
  if (!_credentialsSet()) {
    console.warn('[CAAP] ⚠️  Supabase credentials not set — running in localStorage mode.');
  }
  return false;
}

// Try immediately, then retry after DOM ready (handles CDN load race condition)
_tryInit();
document.addEventListener('DOMContentLoaded', _tryInit);

// ─────────────────────────────────────────────
//  CONTENT DEFAULTS
// ─────────────────────────────────────────────
const CONTENT_DEFAULTS = {
  home: {
    heroSlides: [],
    bgImage:    '',
    tagline:  'Bungoma County, Kenya',
    headline: 'Fighting Poverty, Building Hope.',
    subtext:  'A grassroots movement dedicated to sustainable development, dignity, and direct community action in Western Kenya.',
    partners: 'BUNGOMA GOVT,USAID PARTNERS,KCB BANK',
    stats: [
      { num: '1,500+', label: 'Residents Served' },
      { num: '84',     label: 'Volunteers'        },
      { num: '12',     label: 'Live Projects'     }
    ]
  },
  about: {
    statValue: '2020', statLabel: 'ESTABLISHED',
    statSub:   "Bungoma's Leading NGO for Grassroots Action",
    storyP1: 'Community Action Against Poverty (CAAP) was born out of a necessity to see Bungoma County thrive.',
    storyP2: 'We work with local coffee co-operatives, schools, and health centers to ensure solutions are owned by the community.',
    vision:  'A thriving Bungoma where every household has quality education and the resources to be completely self-reliant.',
    founded: '2020, Bungoma County, Western Kenya.',
    mission: 'To empower marginalized communities through education, mental health advocacy, and economic opportunity creation.',
    approach:'Community-first. We work with the people, not for them.',
    impactResidents: '1,500+', impactVolunteers: '84', impactProjects: '12'
  },
  programs:   [],
  projects:   [],
  gallery:    [],
  objectives: [],
  values:     [],
  team:       [],
  news:       [],
  donate: {
    paybill: '000000', accName: 'CAAP',
    bankName: 'KCB / Equity Bank', bankAcc: '1234567890',
    cryptoType: 'USDT / BTC', cryptoLabel: 'USDT (TRC-20):', cryptoWallet: 'TYourWalletAddressHere...'
  },
  contact: { phone: '', email: '', whatsapp: '', youtube: '', instagram: '', twitter: '', facebook: '',
             lat: '0.5635', lng: '34.5607', locationLabel: 'Bungoma, Western Kenya',
             directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Bungoma+Kenya' }
};

// ─────────────────────────────────────────────
//  MAIN API — window.DB
// ─────────────────────────────────────────────
window.DB = {

  isConnected() { _tryInit(); return _connected; },

  async getContent() {
    if (!_connected) return _getLocalContent();
    try {
      const [settings, programs, projects, gallery, objectives, values, team, news] = await Promise.all([
        _db().from('site_settings').select('*').single(),
        _db().from('programs').select('*').order('sort_order'),
        _db().from('projects').select('*').order('sort_order'),
        _db().from('gallery').select('*').order('sort_order'),
        _db().from('objectives').select('*').order('sort_order'),
        _db().from('org_values').select('*').order('sort_order'),
        _db().from('team_members').select('*').order('sort_order'),
        _db().from('news').select('*').order('sort_order'),
      ]);
      const s = settings.data || {};
      return {
        home: {
          heroSlides: s.home_hero_slides || [],
          bgImage:    s.home_bg_image    || '',
          tagline:    s.home_tagline  ?? CONTENT_DEFAULTS.home.tagline,
          headline:   s.home_headline ?? CONTENT_DEFAULTS.home.headline,
          subtext:    s.home_subtext  ?? CONTENT_DEFAULTS.home.subtext,
          partners:   s.home_partners ?? CONTENT_DEFAULTS.home.partners,
          stats:      (s.home_stats && s.home_stats.length > 0) ? s.home_stats : CONTENT_DEFAULTS.home.stats,
        },
        about: {
          statValue: s.about_stat_value || '2024', statLabel: s.about_stat_label || 'ESTABLISHED',
          statSub: s.about_stat_sub || '', storyP1: s.about_story_p1 || '', storyP2: s.about_story_p2 || '',
          vision: s.about_vision || '', founded: s.about_founded || '', mission: s.about_mission || '',
          approach: s.about_approach || '', impactResidents: s.about_impact_residents || '0',
          impactVolunteers: s.about_impact_volunteers || '0', impactProjects: s.about_impact_projects || '0',
        },
        programs:   (programs.data   || []).map(_mapProgram),
        projects:   (projects.data   || []).map(_mapProject),
        gallery:    (gallery.data    || []).map(_mapGallery),
        objectives: (objectives.data || []).map(_mapObjective),
        values:     (values.data     || []).map(_mapValue),
        team:       (team.data       || []).map(_mapTeamMember),
        news:       (news.data       || []).map(_mapNews),
        donate: {
          paybill:      (s.donate_paybill      ?? ''),
          accName:      (s.donate_acc_name     ?? ''),
          bankName:     (s.donate_bank_name    ?? ''),
          bankAcc:      (s.donate_bank_acc     ?? ''),
          cryptoType:   (s.donate_crypto_type  ?? ''),
          cryptoLabel:  (s.donate_crypto_label ?? ''),
          cryptoWallet: (s.donate_crypto_wallet?? ''),
        },
        contact: {
          phone:        (s.contact_phone       ?? ''),
          email:        (s.contact_email       ?? ''),
          whatsapp:     (s.contact_whatsapp    ?? ''),
          youtube:      (s.social_youtube      ?? ''),
          instagram:    (s.social_instagram    ?? ''),
          twitter:      (s.social_x_twitter    ?? ''),
          facebook:     (s.social_facebook     ?? ''),
          lat:          (s.location_lat        ?? '0.5635'),
          lng:          (s.location_lng        ?? '34.5607'),
          locationLabel:(s.location_label      ?? 'Bungoma, Western Kenya'),
          directionsUrl:(s.location_directions ?? 'https://www.google.com/maps/dir/?api=1&destination=Bungoma+Kenya'),
        },
        research_data: s.research_data || null,
      };
    } catch (err) { console.error('[CAAP] getContent error:', err); return _getLocalContent(); }
  },

  async saveSettings(data) {
    if (!_connected) { _saveLocalSettings(data); return { ok: true }; }
    try {
      const { error } = await _db().from('site_settings').upsert({ id: 1, ...data });
      if (error) throw error;
      return { ok: true };
    } catch (err) { console.error('[CAAP] saveSettings error:', err); _saveLocalSettings(data); return { ok: false, error: err.message }; }
  },

  async saveHome(home) {
    const payload = {
      home_hero_slides: home.heroSlides || [],
      home_bg_image:    home.bgImage    || '',
      home_tagline:     home.tagline    || '',
      home_headline:    home.headline   || '',
      home_subtext:     home.subtext    || '',
      home_partners:    home.partners   || '',
      home_stats:       home.stats      || [],
    };
    return this.saveSettings(payload);
  },

  async saveAbout(about) {
    return this.saveSettings({
      about_stat_value: about.statValue||'', about_stat_label: about.statLabel||'', about_stat_sub: about.statSub||'',
      about_story_p1: about.storyP1||'', about_story_p2: about.storyP2||'', about_vision: about.vision||'',
      about_founded: about.founded||'', about_mission: about.mission||'', about_approach: about.approach||'',
      about_impact_residents: about.impactResidents||'', about_impact_volunteers: about.impactVolunteers||'',
      about_impact_projects: about.impactProjects||'',
    });
  },

  async saveDonate(donate) {
    return this.saveSettings({
      donate_paybill: donate.paybill||'', donate_acc_name: donate.accName||'',
      donate_bank_name: donate.bankName||'', donate_bank_acc: donate.bankAcc||'',
      donate_crypto_type: donate.cryptoType||'', donate_crypto_label: donate.cryptoLabel||'',
      donate_crypto_wallet: donate.cryptoWallet||'',
    });
  },

  async saveContact(contact) {
    return this.saveSettings({
      contact_phone:       contact.phone        || '',
      contact_email:       contact.email        || '',
      contact_whatsapp:    contact.whatsapp     || '',
      social_youtube:      contact.youtube      || '',
      social_instagram:    contact.instagram    || '',
      social_x_twitter:    contact.twitter      || '',
      social_facebook:     contact.facebook     || '',
      location_lat:        contact.lat          || '0.5635',
      location_lng:        contact.lng          || '34.5607',
      location_label:      contact.locationLabel|| 'Bungoma, Western Kenya',
      location_directions: contact.directionsUrl|| '',
    });
  },

  async saveTable(tableName, rows) {
    if (!_connected) { _saveLocalTable(tableName, rows); return { ok: true }; }
    try {
      const { error: delErr } = await _db().from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (delErr) throw delErr;
      if (rows.length > 0) {
        const { error: insErr } = await _db().from(tableName).insert(rows);
        if (insErr) throw insErr;
      }
      return { ok: true };
    } catch (err) { console.error(`[CAAP] saveTable(${tableName}) error:`, err); _saveLocalTable(tableName, rows); return { ok: false, error: err.message }; }
  },

  async savePrograms(programs)  { return this.saveTable('programs',   programs.map((p,i)=>({icon:p.icon||'fa-star',title:p.title||'',description:p.desc||'',image_url:p.image||'',sort_order:i+1}))); },
  async saveProjects(projects)  { return this.saveTable('projects',   projects.map((p,i)=>({title:p.title||'',status:p.status||'Planning',description:p.desc||'',image_url:p.image||'',sort_order:i+1}))); },
  async saveGallery(gallery)    { return this.saveTable('gallery',    gallery.map((g,i)=>({image_url:g.dataUrl||g.image_url||'',caption:g.caption||'',sort_order:i+1}))); },
  async saveObjectives(objs)    { return this.saveTable('objectives', objs.map((o,i)=>({icon:o.icon||'fa-star',title:o.title||'',description:o.desc||'',image_url:o.image||'',sort_order:i+1}))); },
  async saveValues(values)      { return this.saveTable('org_values', values.map((v,i)=>({title:v.title||'',description:v.desc||'',sort_order:i+1}))); },
  async saveNews(articles)      { return this.saveTable('news',       articles.map((n,i)=>({date_label:n.date||'',title:n.title||'',content:n.content||'',image_url:n.image||'',is_published:true,sort_order:i+1}))); },
  async saveTeam(members) {
    return this.saveTable('team_members', members.map((m,i) => ({
      name:m.name||'', title:m.title||'', category:m.category||'leadership', bio:m.bio||'',
      email:m.email||'', phone:m.phone||'', linkedin:m.linkedin||'', twitter:m.twitter||'',
      photo_url:m.photo||'', sort_order:i+1
    })));
  },

  async uploadImage(file, folder='gallery', quality=0.78, maxWidth=1200) {
    const compressed = await _compressToBlob(file, maxWidth, quality);
    if (!_connected) {
      const dataUrl = await _blobToDataUrl(compressed);
      return { ok: true, url: dataUrl, isDataUrl: true };
    }
    try {
      const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { data, error } = await _db().storage.from(STORAGE_BUCKET).upload(filename, compressed, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      const { data: urlData } = _db().storage.from(STORAGE_BUCKET).getPublicUrl(filename);
      return { ok: true, url: urlData.publicUrl, isDataUrl: false };
    } catch (err) {
      const dataUrl = await _blobToDataUrl(compressed);
      return { ok: true, url: dataUrl, isDataUrl: true, warn: 'Storage failed, using base64' };
    }
  },

  async deleteImage(publicUrl) {
    if (!_connected || !publicUrl || publicUrl.startsWith('data:')) return;
    try {
      const path = publicUrl.split(`/${STORAGE_BUCKET}/`)[1];
      if (path) await _db().storage.from(STORAGE_BUCKET).remove([path]);
    } catch {}
  },

  async signIn(email, password) {
    if (!_connected) return { ok: false, error: 'Supabase not connected' };
    try {
      const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { ok: true, user: data.user, session: data.session };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async signOut() { if (_connected) try { await _supabase.auth.signOut(); } catch {} },

  async getSession() {
    if (!_connected) return null;
    try { const { data } = await _supabase.auth.getSession(); return data?.session || null; }
    catch { return null; }
  },

  // ── MFA (TOTP) ──────────────────────────────────────────────────────────────
  async getMFAAssuranceLevel() {
    if (!_connected) return null;
    try { const { data } = await _supabase.auth.mfa.getAuthenticatorAssuranceLevel(); return data; }
    catch { return null; }
  },

  async mfaEnroll() {
    if (!_connected) return { ok: false, error: 'Not connected' };
    try {
      const { data, error } = await _supabase.auth.mfa.enroll({
        factorType: 'totp', issuer: 'CAAP Admin', friendlyName: 'Authenticator App'
      });
      if (error) throw error;
      return { ok: true, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async mfaVerify(factorId, code) {
    if (!_connected) return { ok: false, error: 'Not connected' };
    try {
      const cleanCode = String(code).replace(/\s+/g, '').slice(0, 6);
      const { data: chal, error: ce } = await _supabase.auth.mfa.challenge({ factorId });
      if (ce) throw ce;
      const { data, error } = await _supabase.auth.mfa.verify({
        factorId, challengeId: chal.id, code: cleanCode
      });
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async mfaListFactors() {
    if (!_connected) return [];
    try {
      const { data, error } = await _supabase.auth.mfa.listFactors();
      if (error) { console.warn('[MFA] listFactors error:', error); return []; }
      // Handle both response structures across supabase-js v2 versions
      if (Array.isArray(data))   return data;
      if (data?.totp)            return data.totp;
      if (data?.all)             return data.all.filter(f => f.factor_type === 'totp');
      return [];
    } catch (err) { console.error('[MFA] listFactors threw:', err); return []; }
  },

  async mfaUnenroll(factorId) {
    if (!_connected) return { ok: false, error: 'Not connected' };
    try {
      const { error } = await _supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async submitVolunteerApplication(data) {
    if (!_connected) return { ok: true };
    try {
      const { error } = await _db().from('volunteer_applications').insert({
        full_name: data.name, email: data.email, phone: data.phone || '',
        skills: data.skills || [], background: data.background || ''
      });
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async submitPartnershipEnquiry(data) {
    if (!_connected) return { ok: true };
    try {
      const { error } = await _db().from('partnership_enquiries').insert({
        organisation: data.organisation, contact_person: data.contactPerson,
        email: data.email, phone: data.phone || '',
        partnership_type: data.partnershipType || '',
        programs: data.programs || [], message: data.message || ''
      });
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async logDonation(data) {
    if (!_connected) return { ok: true };
    try {
      const { error } = await _db().from('donations').insert({
        donor_name:  data.donorName  || 'Anonymous',
        amount_kes:  data.amount,
        method:      data.method     || 'M-Pesa',
        reference:   data.reference  || '',
        notes:       data.notes      || '',
        received_at: data.receivedAt || new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async getDonations(limit=50)   { if (!_connected) return []; try { const { data } = await _db().from('donations').select('*').order('created_at',{ascending:false}).limit(limit); return data||[]; } catch { return []; } },
  async getVolunteers(limit=100) { if (!_connected) return []; try { const { data } = await _db().from('volunteer_applications').select('*').order('applied_at',{ascending:false}).limit(limit); return data||[]; } catch { return []; } },
  async getPartners(limit=100)   { if (!_connected) return []; try { const { data } = await _db().from('partnership_enquiries').select('*').order('submitted_at',{ascending:false}).limit(limit); return data||[]; } catch { return []; } },

  async updateVolunteerStatus(id, status) { if (_connected) await _db().from('volunteer_applications').update({ status }).eq('id', id); },
  async updatePartnerStatus(id, status)   { if (_connected) await _db().from('partnership_enquiries').update({ status }).eq('id', id); },
  async deleteDonation(id)  { if (_connected) await _db().from('donations').delete().eq('id', id); },
  async deleteVolunteer(id) { if (_connected) await _db().from('volunteer_applications').delete().eq('id', id); },
  async deletePartner(id)   { if (_connected) await _db().from('partnership_enquiries').delete().eq('id', id); },

  // ── SURVEYS ──
  async getActiveSurvey() {
    if (!_connected) return null;
    try {
      const { data } = await _db().from('surveys')
        .select('*').eq('is_active', true).order('created_at', {ascending:false}).limit(1).single();
      return data || null;
    } catch { return null; }
  },

  async getAllSurveys() {
    if (!_connected) return [];
    try { const { data } = await _db().from('surveys').select('*').order('created_at', {ascending:false}); return data||[]; }
    catch { return []; }
  },

  async saveSurvey(survey) {
    if (!_connected) return { ok: false, error: 'Not connected' };
    try {
      const row = {
        title_en: survey.title_en||'', title_sw: survey.title_sw||'',
        description_en: survey.description_en||'', description_sw: survey.description_sw||'',
        questions: survey.questions||[], is_active: survey.is_active||false,
        target_group: survey.target_group||'farmers',
        updated_at: new Date().toISOString(),
      };
      let res;
      if (survey.id) {
        const { error } = await _db().from('surveys').update(row).eq('id', survey.id);
        res = error;
      } else {
        const { error } = await _db().from('surveys').insert(row);
        res = error;
      }
      if (res) throw res;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async deleteSurvey(id) {
    if (!_connected) return;
    try { await _db().from('surveys').delete().eq('id', id); } catch {}
  },

  async toggleSurvey(id, active) {
    if (!_connected) return { ok: false };
    try {
      await _db().from('surveys').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      if (active) await _db().from('surveys').update({ is_active: true }).eq('id', id);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async submitSurveyResponse(data) {
    if (!_connected) return { ok: false, error: 'Not connected' };
    try {
      const { error } = await _db().from('survey_responses').insert({
        survey_id:        data.surveyId,
        respondent_name:  data.name    || 'Anonymous',
        respondent_phone: data.phone   || '',
        language:         data.language|| 'en',
        answers:          data.answers || {},
      });
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async getSurveyResponses(surveyId, limit=500) {
    if (!_connected) return [];
    try {
      const { data } = await _db().from('survey_responses')
        .select('*').eq('survey_id', surveyId)
        .order('submitted_at', {ascending:false}).limit(limit);
      return data || [];
    } catch { return []; }
  },

  async deleteSurveyResponse(id) {
    if (!_connected) return;
    try { await _db().from('survey_responses').delete().eq('id', id); } catch {}
  },

  // ── OUR PARTNERS (displayed on public site) ──
  async getOurPartners() {
    if (!_connected) return null;
    try {
      const { data } = await _db().from('our_partners').select('*').order('sort_order');
      return data || [];
    } catch { return null; }
  },

  async saveOurPartners(partners) {
    if (!_connected) return { ok: true };
    try {
      await _db().from('our_partners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (partners.length > 0) {
        const rows = partners.map((p, i) => ({
          name: p.name||'', logo_url: p.logo||'', website_url: p.url||'', sort_order: i+1
        }));
        const { error } = await _db().from('our_partners').insert(rows);
        if (error) throw error;
      }
      return { ok: true };
    } catch (err) { console.error('[CAAP] saveOurPartners error:', err); return { ok: false, error: err.message }; }
  },

  // ── CAREERS / JOIN US ────────────────────────────────────────────────────────

  // Public: get only active opportunities
  async getOpportunities() {
    if (!_connected) return [];
    try {
      const { data, error } = await _db().from('opportunities')
        .select('*').eq('is_active', true).order('sort_order').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) { console.error('[CAAP] getOpportunities:', err); return []; }
  },

  // Admin: get all opportunities (active + inactive)
  async getAllOpportunities() {
    if (!_connected) return [];
    try {
      const { data, error } = await _db().from('opportunities')
        .select('*').order('sort_order').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) { console.error('[CAAP] getAllOpportunities:', err); return []; }
  },

  // Admin: create or update opportunity
  async saveOpportunity(opp) {
    if (!_connected) return { ok: false, error: 'Not connected' };
    try {
      const row = {
        title:        opp.title        || '',
        type:         opp.type         || 'Job',
        description:  opp.description  || '',
        requirements: opp.requirements || '',
        location:     opp.location     || '',
        deadline:     opp.deadline     || null,
        is_active:    opp.is_active !== undefined ? opp.is_active : true,
        sort_order:   opp.sort_order   || 0,
        updated_at:   new Date().toISOString(),
      };
      let error;
      if (opp.id) {
        ({ error } = await _db().from('opportunities').update(row).eq('id', opp.id));
      } else {
        ({ error } = await _db().from('opportunities').insert(row));
      }
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  // Admin: toggle active/inactive
  async toggleOpportunity(id, isActive) {
    if (!_connected) return { ok: false };
    try {
      const { error } = await _db().from('opportunities')
        .update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  // Admin: delete opportunity (cascades to applications via ON DELETE SET NULL)
  async deleteOpportunity(id) {
    if (!_connected) return { ok: false };
    try {
      const { error } = await _db().from('opportunities').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  // Public: submit application (CV already uploaded, url passed in)
  async submitApplication(data) {
    if (!_connected) return { ok: false, error: 'Not connected' };
    try {
      const { error } = await _db().from('job_applications').insert({
        opportunity_id:    data.opportunityId    || null,
        opportunity_title: data.opportunityTitle || '',
        applicant_name:    data.name             || '',
        email:             data.email            || '',
        phone:             data.phone            || '',
        cv_url:            data.cvUrl            || '',
        cover_letter:      data.coverLetter      || '',
      });
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  // Admin: get all applications (optionally filtered by opportunity)
  async getApplications(opportunityId = null) {
    if (!_connected) return [];
    try {
      let query = _db().from('job_applications').select('*').order('submitted_at', { ascending: false });
      if (opportunityId) query = query.eq('opportunity_id', opportunityId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) { console.error('[CAAP] getApplications:', err); return []; }
  },

  // Admin: update application status
  async updateApplicationStatus(id, status) {
    if (!_connected) return { ok: false };
    try {
      const { error } = await _db().from('job_applications').update({ status }).eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  // Admin: delete application
  async deleteApplication(id) {
    if (!_connected) return { ok: false };
    try {
      const { error } = await _db().from('job_applications').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  // Upload a CV/PDF to Supabase Storage — returns { ok, url }
  async uploadCV(file) {
    if (!_connected) return { ok: false, error: 'Not connected — cannot upload CV' };
    try {
      const ext      = file.name.split('.').pop().toLowerCase();
      const allowed  = ['pdf','doc','docx'];
      if (!allowed.includes(ext)) return { ok: false, error: 'Only PDF, DOC, DOCX files are accepted.' };
      if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'File must be under 5MB.' };
      const filename = `cvs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await _db().storage
        .from(STORAGE_BUCKET).upload(filename, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: urlData } = _db().storage.from(STORAGE_BUCKET).getPublicUrl(filename);
      return { ok: true, url: urlData.publicUrl };
    } catch (err) { return { ok: false, error: err.message }; }
  },

  async migrateFromLocalStorage() {
    _tryInit();
    if (!_connected) {
      alert('Supabase not connected. Make sure you pasted your real URL and anon key in supabase.js, then reload the page.');
      return;
    }
    const local = _getLocalContent();
    const results = await Promise.all([
      this.saveHome(local.home), this.saveAbout(local.about), this.saveDonate(local.donate),
      this.savePrograms(local.programs), this.saveProjects(local.projects),
      this.saveObjectives(local.objectives), this.saveValues(local.values),
      this.saveTeam(local.team), this.saveNews(local.news), this.saveGallery(local.gallery)
    ]);
    const failed = results.filter(r => !r.ok);
    return failed.length === 0
      ? { ok: true, message: 'Migration complete!' }
      : { ok: false, message: `${failed.length} sections failed.` };
  },

  subscribeToContent(callback) {
    if (!_connected) return null;
    return _supabase.channel('content-changes').on('postgres_changes', {event:'*', schema:'public'}, callback).subscribe();
  },
  unsubscribe(sub) { if (_connected && sub) _supabase.removeChannel(sub); },

  showStatusBanner() {
    if (_connected) return;
    const b = document.createElement('div');
    b.id = 'supabase-status-banner';
    b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#92400e;color:white;text-align:center;padding:8px 20px;font-size:.78rem;font-family:sans-serif;display:flex;justify-content:center;align-items:center;gap:12px;';
    b.innerHTML = `⚠️ <strong>Supabase not connected</strong> — running in localStorage mode. Fill in supabase.js credentials to go live. <button onclick="document.getElementById('supabase-status-banner').remove()" style="background:rgba(255,255,255,.2);border:none;color:white;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:.78rem;">Dismiss</button>`;
    document.body.appendChild(b);
  }
};

// ─────────────────────────────────────────────
//  INTERNALS
// ─────────────────────────────────────────────
function _mapProgram(r)    { return { id:r.id, icon:r.icon, title:r.title, desc:r.description, image:r.image_url }; }
function _mapProject(r)    { return { id:r.id, title:r.title, status:r.status, desc:r.description, image:r.image_url }; }
function _mapGallery(r)    { return { id:r.id, dataUrl:r.image_url, caption:r.caption }; }
function _mapObjective(r)  { return { id:r.id, icon:r.icon, title:r.title, desc:r.description, image:r.image_url }; }
function _mapValue(r)      { return { id:r.id, title:r.title, desc:r.description }; }
function _mapTeamMember(r) { return { id:r.id, name:r.name, title:r.title, category:r.category, bio:r.bio, email:r.email, phone:r.phone, linkedin:r.linkedin, twitter:r.twitter, photo:r.photo_url }; }
function _mapNews(r)       { return { id:r.id, date:r.date_label, title:r.title, content:r.content, image:r.image_url }; }

function _getLocalContent() {
  try { const s = JSON.parse(localStorage.getItem(CONTENT_KEY) || '{}'); return _deepMerge(CONTENT_DEFAULTS, s); }
  catch { return JSON.parse(JSON.stringify(CONTENT_DEFAULTS)); }
}

function _saveLocalSettings(data) {
  const C = _getLocalContent();
  const map = {
    home_hero_slides:'home.heroSlides', home_bg_image:'home.bgImage',
    home_tagline:'home.tagline', home_headline:'home.headline', home_subtext:'home.subtext',
    home_partners:'home.partners', home_stats:'home.stats',
    about_stat_value:'about.statValue', about_stat_label:'about.statLabel', about_stat_sub:'about.statSub',
    about_story_p1:'about.storyP1', about_story_p2:'about.storyP2', about_vision:'about.vision',
    about_founded:'about.founded', about_mission:'about.mission', about_approach:'about.approach',
    about_impact_residents:'about.impactResidents', about_impact_volunteers:'about.impactVolunteers', about_impact_projects:'about.impactProjects',
    donate_paybill:'donate.paybill', donate_acc_name:'donate.accName', donate_bank_name:'donate.bankName',
    donate_bank_acc:'donate.bankAcc', donate_crypto_type:'donate.cryptoType', donate_crypto_label:'donate.cryptoLabel', donate_crypto_wallet:'donate.cryptoWallet',
    contact_phone:'contact.phone', contact_email:'contact.email', contact_whatsapp:'contact.whatsapp',
    social_youtube:'contact.youtube', social_instagram:'contact.instagram',
    social_x_twitter:'contact.twitter', social_facebook:'contact.facebook',
    location_lat:'contact.lat', location_lng:'contact.lng',
    location_label:'contact.locationLabel', location_directions:'contact.directionsUrl',
  };
  for (const [k, path] of Object.entries(map)) {
    if (data[k] !== undefined) {
      const [sec, field] = path.split('.');
      if (!C[sec]) C[sec] = {};
      C[sec][field] = data[k];
    }
  }
  localStorage.setItem(CONTENT_KEY, JSON.stringify(C));
}

function _saveLocalTable(tableName, rows) {
  const C = _getLocalContent();
  const map = { programs:'programs', projects:'projects', gallery:'gallery', objectives:'objectives', org_values:'values', team_members:'team', news:'news' };
  const key = map[tableName]; if (!key) return;
  if (tableName==='programs'||tableName==='objectives') C[key]=rows.map(r=>({icon:r.icon,title:r.title,desc:r.description,image:r.image_url}));
  else if (tableName==='projects')     C[key]=rows.map(r=>({title:r.title,status:r.status,desc:r.description}));
  else if (tableName==='gallery')      C[key]=rows.map(r=>({dataUrl:r.image_url,caption:r.caption}));
  else if (tableName==='org_values')   C[key]=rows.map(r=>({title:r.title,desc:r.description}));
  else if (tableName==='team_members') C[key]=rows.map(r=>({name:r.name,title:r.title,category:r.category,bio:r.bio,email:r.email,phone:r.phone,linkedin:r.linkedin,twitter:r.twitter,photo:r.photo_url}));
  else if (tableName==='news')         C[key]=rows.map(r=>({date:r.date_label,title:r.title,content:r.content,image:r.image_url}));
  localStorage.setItem(CONTENT_KEY, JSON.stringify(C));
}

function _deepMerge(def, src) {
  const out = {...def};
  for (const k in src) {
    if (src[k] !== null && typeof src[k] === 'object' && !Array.isArray(src[k]))
      out[k] = _deepMerge(def[k] || {}, src[k]);
    else if (Array.isArray(src[k]) && src[k].length === 0 && Array.isArray(def[k]) && def[k].length > 0)
      out[k] = def[k]; // keep non-empty defaults when saved value is empty array
    else out[k] = src[k];
  }
  return out;
}

async function _compressToBlob(file, maxWidth, quality) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });
}

async function _blobToDataUrl(blob) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsDataURL(blob);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // If Supabase CDN loaded async before us, init now
  _tryInit();
  // Give async CDN script up to 3s to load, then fire db-ready regardless
  function _dispatchReady() {
    window.dispatchEvent(new CustomEvent('caap:db-ready', { detail: { connected: _connected } }));
    if (document.getElementById('auth-overlay')) window.DB.showStatusBanner();
  }
  if (_connected) {
    _dispatchReady();
  } else {
    // Poll for Supabase CDN up to 3 seconds
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (_tryInit() || attempts >= 15) {
        clearInterval(poll);
        _dispatchReady();
      }
    }, 200);
  }
});