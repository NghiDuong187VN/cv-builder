import type { TemplateLibraryItem } from '@/components/templates/templateCatalog';
import styles from '@/components/templates/TemplatesPage.module.css';

function Line({ width, color }: { width: string; color: string }) {
  return <div className={styles.line} style={{ width, background: color, height: '4px' }} />;
}

export default function TemplateThumbnail({
  template,
  large = false,
}: {
  template: TemplateLibraryItem;
  large?: boolean;
}) {
  const { thumbnail } = template;
  const headerBackground =
    thumbnail.pattern === 'bold'
      ? `linear-gradient(135deg, ${thumbnail.primary}, ${thumbnail.secondary})`
      : thumbnail.primary;

  const containerStyle = large
    ? { width: '100%', aspectRatio: '1 / 1.38' }
    : undefined;

  return (
    <div
      className={styles.thumb}
      style={{
        background: `linear-gradient(145deg, ${thumbnail.primary}, ${thumbnail.secondary})`,
        ...containerStyle,
      }}
    >
      <div className={styles.thumbInner}>
        <div className={styles.thumbPaper}>
          <div className={styles.paperHeader} style={{ background: headerBackground }}>
            <div className={styles.paperAvatar} />
            <div style={{ flex: 1, display: 'grid', gap: '4px' }}>
              <Line width="58%" color="rgba(255,255,255,0.8)" />
              <Line width="34%" color="rgba(255,255,255,0.52)" />
            </div>
          </div>

          {template.layoutType === '2col' ? (
            <div className={styles.paperBody}>
              <div
                className={styles.paperSidebar}
                style={{
                  background:
                    thumbnail.pattern === 'split'
                      ? 'rgba(255,255,255,0.24)'
                      : 'rgba(15,23,42,0.08)',
                }}
              >
                <Line width="72%" color={thumbnail.accent} />
                <Line width="86%" color="rgba(15,23,42,0.14)" />
                <Line width="54%" color="rgba(15,23,42,0.12)" />
                <Line width="64%" color="rgba(15,23,42,0.1)" />
                <Line width="76%" color="rgba(15,23,42,0.1)" />
              </div>
              <div className={styles.paperMain}>
                <Line width="66%" color="rgba(15,23,42,0.18)" />
                <Line width="86%" color="rgba(15,23,42,0.11)" />
                <Line width="72%" color="rgba(15,23,42,0.1)" />
                <Line width="92%" color="rgba(15,23,42,0.11)" />
                <Line width="58%" color="rgba(15,23,42,0.1)" />
                <Line width="84%" color="rgba(15,23,42,0.1)" />
              </div>
            </div>
          ) : (
            <div className={styles.paperSingle}>
              <Line width="44%" color={thumbnail.accent} />
              <Line width="86%" color="rgba(15,23,42,0.12)" />
              <Line width="78%" color="rgba(15,23,42,0.1)" />
              <Line width="90%" color="rgba(15,23,42,0.11)" />
              <Line width="64%" color="rgba(15,23,42,0.1)" />
              <Line width="84%" color="rgba(15,23,42,0.11)" />
              <Line width="70%" color="rgba(15,23,42,0.1)" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
