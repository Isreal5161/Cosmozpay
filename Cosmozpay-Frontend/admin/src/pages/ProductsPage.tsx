import { useEffect, useMemo, useState } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { adminMockService, type BannerItem, type ServiceItem } from '../services/mockAdminService';

type ServiceGroup = {
  key: string;
  category: string;
  name: string;
  network: string;
  description: string;
  plans: ServiceItem[];
  status: ServiceItem['status'];
  popular: boolean;
};

function ProductsPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ServiceGroup | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [draftPlan, setDraftPlan] = useState<ServiceItem | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<BannerItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [svcData, bannerData] = await Promise.all([adminMockService.fetchServices(), adminMockService.fetchBanners()]);
      setServices(svcData);
      setBanners(bannerData);
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(
    () => services.filter((service) => `${service.category} ${service.name} ${service.network} ${service.plan}`.toLowerCase().includes(search.toLowerCase())),
    [services, search],
  );

  const groupedServices = useMemo(() => {
    const groups = new Map<string, ServiceGroup>();
    filtered.forEach((service) => {
      const key = `${service.category}:${service.name}:${service.network}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          category: service.category,
          name: service.name,
          network: service.network,
          description: service.description,
          plans: [service],
          status: service.status,
          popular: service.popular,
        });
      } else {
        groups.get(key)!.plans.push(service);
      }
    });
    return Array.from(groups.values());
  }, [filtered]);

  const selectedPlan = useMemo(() => {
    if (!selectedGroup) return null;
    return selectedGroup.plans.find((plan) => plan.id === selectedPlanId) ?? selectedGroup.plans[0];
  }, [selectedGroup, selectedPlanId]);

  useEffect(() => {
    if (selectedPlan) setDraftPlan(selectedPlan);
  }, [selectedPlan]);

  const openGroup = (group: ServiceGroup) => {
    setSelectedGroup(group);
    setSelectedPlanId(group.plans[0]?.id ?? null);
  };

  const updateProviderOption = (index: number, field: 'enabled' | 'sourcePrice' | 'sellingPrice', value: boolean | number) => {
    if (!draftPlan) return;
    const providerOptions = draftPlan.providerOptions.map((provider, providerIndex) =>
      providerIndex === index ? { ...provider, [field]: value } : provider,
    );
    setDraftPlan({ ...draftPlan, providerOptions });
  };

  const savePlan = async () => {
    if (!draftPlan) return;
    const enabledProviders = draftPlan.providerOptions.filter((provider) => provider.enabled);
    const primary = enabledProviders[0] ?? draftPlan.providerOptions[0];
    const updatedPlan: ServiceItem = {
      ...draftPlan,
      provider: primary?.name ?? draftPlan.provider,
      sellingPrice: primary?.sellingPrice ?? draftPlan.sellingPrice,
      displayPrice: primary?.sellingPrice ?? draftPlan.displayPrice,
      margin: (primary?.sellingPrice ?? draftPlan.sellingPrice) - (primary?.sourcePrice ?? 0),
    };
    await adminMockService.updateService(updatedPlan.id, updatedPlan);
    const refreshed = await adminMockService.fetchServices();
    setServices(refreshed);
    const refreshedGroup = refreshed
      .filter((service) => `${service.category}:${service.name}:${service.network}` === selectedGroup?.key)
      .sort((a, b) => a.order - b.order);
    if (selectedGroup) {
      setSelectedGroup({ ...selectedGroup, plans: refreshedGroup, status: updatedPlan.status, popular: refreshedGroup.some((plan) => plan.popular) });
      setSelectedPlanId(updatedPlan.id);
      setDraftPlan(updatedPlan);
    }
    setToast('Plan pricing saved');
  };

  const toggleBanner = async (banner: BannerItem) => {
    await adminMockService.updateBanner(banner.id, { active: !banner.active });
    const refreshed = await adminMockService.fetchBanners();
    setBanners(refreshed);
    setToast('Banner updated');
  };

  return (
    <div>
      <h1 className="page-heading">Service Management</h1>

      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Provider-driven catalog ({filtered.length})</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services, networks, plans"
            style={{ padding: '8px 12px', border: '1px solid #dbe2ef', borderRadius: 8, minWidth: 260 }}
          />
        </div>

        {loading ? (
          <div>Loading services…</div>
        ) : (
          groupedServices.map((group) => {
            const providerNames = Array.from(
              new Set(group.plans.flatMap((plan) => plan.providerOptions.filter((provider) => provider.enabled).map((provider) => provider.name))),
            );
            return (
              <div key={group.key} style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12 }}>{group.category}</h3>
                <div className="panel-card" style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{group.name}</strong>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{group.network} • {group.description}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>Plans available: {group.plans.map((plan) => plan.plan).join(', ')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div><strong>Top plan:</strong> ₦{group.plans[0]?.sellingPrice}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Available providers: {providerNames.join(', ') || 'None'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => openGroup(group)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbe2ef', background: 'white' }}>
                      Configure plans
                    </button>
                    <span style={{ padding: '8px 12px', borderRadius: 6, background: group.status === 'Active' ? '#ecfdf5' : '#fef2f2', color: group.status === 'Active' ? '#047857' : '#b91c1c' }}>{group.status}</span>
                    {group.popular && <span style={{ padding: '8px 12px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8' }}>Popular</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="panel">
        <h2 className="section-title">Home Banner Management</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {banners.map((banner) => (
            <div key={banner.id} className="panel-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{banner.title}</strong>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{banner.startDate} → {banner.endDate}</div>
              </div>
              <div>
                <button onClick={() => setSelectedBanner(banner)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #dbe2ef', background: 'white', marginRight: 8 }}>Preview</button>
                <button onClick={() => void toggleBanner(banner)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #dbe2ef', background: banner.active ? '#ecfdf5' : '#fef2f2' }}>{banner.active ? 'Disable' : 'Enable'}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Modal open={!!selectedGroup} title={selectedGroup?.name ?? 'Service'} onClose={() => setSelectedGroup(null)}>
        {selectedGroup && draftPlan && (
          <div className="panel-card">
            <p className="panel-title">Configure provider pricing</p>
            <p>Category: {selectedGroup.category}</p>
            <p>Network: {selectedGroup.network}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
              {selectedGroup.plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: plan.id === draftPlan.id ? '1px solid #1d4ed8' : '1px solid #dbe2ef',
                    background: plan.id === draftPlan.id ? '#eff6ff' : 'white',
                  }}
                >
                  {plan.plan}
                </button>
              ))}
            </div>

            <p>Selected plan: {draftPlan.plan}</p>
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              {draftPlan.providerOptions.map((provider, index) => (
                <div key={provider.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <input type="checkbox" checked={provider.enabled} onChange={(event) => updateProviderOption(index, 'enabled', event.target.checked)} />
                      <strong>{provider.name}</strong>
                    </label>
                    <span style={{ fontSize: 12, color: provider.enabled ? '#047857' : '#9ca3af' }}>{provider.enabled ? 'Available' : 'Not available'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Backend price</div>
                      <input
                        type="number"
                        value={provider.sourcePrice}
                        onChange={(event) => updateProviderOption(index, 'sourcePrice', Number(event.target.value))}
                        style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #dbe2ef', width: 140 }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Sell to users</div>
                      <input
                        type="number"
                        value={provider.sellingPrice}
                        onChange={(event) => updateProviderOption(index, 'sellingPrice', Number(event.target.value))}
                        style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #dbe2ef', width: 140 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <button
                onClick={() => setDraftPlan({ ...draftPlan, status: draftPlan.status === 'Active' ? 'Disabled' : 'Active' })}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbe2ef', background: 'white' }}
              >
                {draftPlan.status === 'Active' ? 'Disable plan' : 'Enable plan'}
              </button>
              <button onClick={() => void savePlan()} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#1d4ed8', color: 'white' }}>
                Save provider settings
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!selectedBanner} title={selectedBanner?.title ?? 'Banner'} onClose={() => setSelectedBanner(null)}>
        {selectedBanner && (
          <div className="panel-card">
            <p className="panel-title">Banner Preview</p>
            <p>{selectedBanner.image}</p>
            <p>Active: {selectedBanner.active ? 'Yes' : 'No'}</p>
            <p>Order: {selectedBanner.order}</p>
            <p>Dates: {selectedBanner.startDate} → {selectedBanner.endDate}</p>
          </div>
        )}
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ProductsPage;
