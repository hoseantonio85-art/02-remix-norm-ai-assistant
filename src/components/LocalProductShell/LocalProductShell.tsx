import { Button, Icon, Text, type TIconProperties } from '@sber-orm/ui-kit';
import { type PropsWithChildren, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LocalProductShell.module.scss';

const navigation: readonly {
  icon: TIconProperties['name'];
  labelKey: string;
  active?: boolean;
}[] = [
  { icon: 'home', labelKey: 'shell.home' },
  { icon: 'lightning', labelKey: 'shell.events' },
  { icon: 'risk', labelKey: 'shell.risks' },
  { icon: 'measure', labelKey: 'shell.measures' },
  { icon: 'analytics', labelKey: 'shell.analytics' },
  { icon: 'monitoring', labelKey: 'shell.aiMonitoring' },
  { icon: 'limitCampaign', labelKey: 'shell.limitCampaign' },
  { icon: 'knowledge', labelKey: 'shell.companyProfile', active: true },
  { icon: 'sidebarProducts', labelKey: 'shell.more' },
];

export function LocalProductShell({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}
      >
        <div className={styles.brand} aria-label='НОРМ'>
          <span className={styles.logo}>
            <Icon name='orm' size='xlg' />
          </span>
          {!collapsed && <strong>НОРМ</strong>}
        </div>

        <div className={styles.organization}>
          <span className={styles.organizationIcon}>
            <Icon name='business' size='sm' />
          </span>
          {!collapsed && (
            <span>
              <Text size='sm' className={styles.muted}>
                {t('shell.organization')}
              </Text>
              <Text size='md' bold>
                {t('shell.company')}
              </Text>
            </span>
          )}
        </div>

        <div className={styles.divider} />

        <nav
          className={styles.navigation}
          aria-label={t('shell.navigationLabel')}
        >
          <Button
            variant='ghost'
            size='M'
            icon='admin'
            iconOnly={collapsed}
            className={styles.navItem}
            title={collapsed ? t('shell.administrator') : undefined}
          >
            {!collapsed && t('shell.administrator')}
          </Button>
          {navigation.map((item) => {
            const label = t(item.labelKey);
            return (
              <Button
                key={item.labelKey}
                variant='ghost'
                size='M'
                icon={item.icon}
                iconOnly={collapsed}
                className={`${styles.navItem} ${item.active ? styles.active : ''}`}
                aria-current={item.active ? 'page' : undefined}
                title={collapsed ? label : undefined}
              >
                {!collapsed && label}
              </Button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div
            className={styles.profile}
            title={collapsed ? t('shell.userName') : undefined}
          >
            <span className={styles.avatar}>{t('shell.userInitials')}</span>
            {!collapsed && (
              <span>
                <Text size='sm' bold>
                  {t('shell.userName')}
                </Text>
                <Text size='sm' className={styles.muted}>
                  {t('shell.userRole')}
                </Text>
              </span>
            )}
          </div>
          <Button
            variant='ghost'
            size='M'
            icon='feedback'
            iconOnly={collapsed}
            className={styles.navItem}
            title={collapsed ? t('shell.support') : undefined}
          >
            {!collapsed && t('shell.support')}
          </Button>
          <div className={styles.divider} />
          <Button
            variant='ghost'
            size='M'
            icon={collapsed ? 'arrowRightSmall' : 'arrowLeftSmall'}
            iconOnly={collapsed}
            className={styles.navItem}
            aria-label={collapsed ? t('shell.expand') : t('shell.collapse')}
            onClick={() => setCollapsed((value) => !value)}
          >
            {!collapsed && t('shell.collapseShort')}
          </Button>
        </div>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
