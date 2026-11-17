import { useStore } from '../state/store';
import { Sheep } from '../sheep/Sheep';
import { RARITY, SERIES, SKINS } from '../sheep/skins';

const GROUPS = [{ id: 'starter', name: 'Starter' }, ...SERIES];

export function ClosetScreen() {
  const owned = useStore((s) => s.owned);
  const equipped = useStore((s) => s.equipped);
  const equip = useStore((s) => s.equip);
  const parade = useStore((s) => s.settings.parade);
  const setSettings = useStore((s) => s.setSettings);

  const total = SKINS.length;
  const have = SKINS.filter((s) => owned[s.id]).length;

  return (
    <div className="panel-body">
      <p className="muted">
        Collected <strong>{have}</strong> of {total} sheep. Tap one to make it your favorite.
      </p>

      <div className="segmented" role="radiogroup" aria-label="Sheep parade">
        <button className={parade === 'favorite' ? 'on' : ''} onClick={() => setSettings({ parade: 'favorite' })}>
          Favorite only
        </button>
        <button className={parade === 'shuffle' ? 'on' : ''} onClick={() => setSettings({ parade: 'shuffle' })}>
          Shuffle collection
        </button>
      </div>

      {GROUPS.map((g) => {
        const skins = SKINS.filter((s) => s.series === g.id);
        const got = skins.filter((s) => owned[s.id]).length;
        return (
          <section key={g.id} className="closet-group">
            <h3>
              {g.name} <span className="muted">{got}/{skins.length}</span>
            </h3>
            <div className="skin-grid">
              {skins.map((skin) => {
                const count = owned[skin.id] ?? 0;
                return (
                  <button
                    key={skin.id}
                    className={`skin-tile ${equipped === skin.id ? 'equipped' : ''}`}
                    disabled={!count}
                    onClick={() => equip(skin.id)}
                    style={{ '--rarity': RARITY[skin.rarity].color } as React.CSSProperties}
                  >
                    <Sheep look={skin.look} silhouette={!count} className="tile-sheep" />
                    <span className="tile-name">{count ? skin.name : '???'}</span>
                    <span className="tile-rarity">
                      {RARITY[skin.rarity].label}
                      {count > 1 && ` · ×${count}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
