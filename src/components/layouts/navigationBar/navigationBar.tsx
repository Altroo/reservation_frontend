'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { styled, ThemeProvider } from '@mui/material/styles';
import MuiAppBar, { type AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Badge,
	Box,
	Button,
	Divider,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	ListItemIcon as MenuListItemIcon,
	ListItemText as MenuListItemText,
	Menu,
	MenuItem,
	Popover,
	Skeleton,
	Stack,
	Toolbar,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	BarChart as BarChartIcon,
	Dashboard as DashboardIcon,
	Domain as DomainIcon,
	DoneAll as DoneAllIcon,
	ExpandMore as ExpandMoreIcon,
	Hotel as HotelIcon,
	Logout as LogoutIcon,
	Menu as MenuIcon,
	MoreVert as MoreVertIcon,
	Notifications as NotificationsIcon,
	Payments as PaymentsIcon,
	People as PeopleIcon,
	Settings as SettingsIcon,
	Apartment as ApartmentIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector, useLanguage } from '@/utils/hooks';
import { getProfilState, getUnreadNotificationCount } from '@/store/selectors';
import { cookiesDeleter } from '@/utils/apiHelpers';
import {
	AUTH_LOGIN,
	BACKEND_SITE_ADMIN,
	BALANCE,
	BUILDINGS_ADD,
	BUILDINGS_LIST,
	CALENDAR,
	COSTS_ADD,
	COSTS_LIST,
	DASHBOARD,
	LOCAUX_ADD,
	LOCAUX_DASHBOARD,
	LOCAUX_LIST,
	LOCAUX_PLANNING,
	DASHBOARD_EDIT_PROFILE,
	DASHBOARD_NOTIFICATIONS,
	DASHBOARD_PASSWORD,
	GAINS,
	OCCUPANCY,
	PLANNING,
	RESERVATIONS_ADD,
	RESERVATIONS_LIST,
	SITE_ROOT,
	USERS_ADD,
	USERS_LIST,
} from '@/utils/routes';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { navigationBarTheme } from '@/utils/themes';
import Image from 'next/image';
import Link from 'next/link';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';
import LanguageSwitcher from '@/components/shared/languageSwitcher/languageSwitcher';
import {
	useGetNotificationsQuery,
	useGetUnreadNotificationCountQuery,
	useMarkNotificationsReadMutation,
} from '@/store/services/reservation';
import { setUnreadCount } from '@/store/slices/notificationSlice';
import { formatDate } from '@/utils/helpers';

import type { TranslationDictionary } from '@/types/languageTypes';

const getNavigationMenu = (isStaff: boolean, t: TranslationDictionary) => {
	return {
		tableau_de_bord: {
			title: t.navigation.dashboard,
			icon: <DashboardIcon />,
			items: [{ title: t.navigation.dashboard, label: t.navigation.viewDashboard, path: DASHBOARD }],
		},
		reservations: {
			title: t.navigation.reservations,
			icon: <HotelIcon />,
			items: [
				{ title: t.navigation.reservationsList, label: t.navigation.reservationsList, path: RESERVATIONS_LIST },
				{ title: t.navigation.newReservation, label: t.navigation.newReservation, path: RESERVATIONS_ADD },
			],
		},
		residences: {
			title: t.navigation.residences,
			icon: <ApartmentIcon />,
			items: [
				{ title: t.navigation.residencesList, label: t.navigation.residencesList, path: BUILDINGS_LIST },
				{ title: t.navigation.newResidence, label: t.navigation.newResidence, path: BUILDINGS_ADD },
			],
		},
		locaux: {
			title: t.navigation.locaux,
			icon: <DomainIcon />,
			items: [
				{ title: t.navigation.locauxList, label: t.navigation.locauxList, path: LOCAUX_LIST },
				{ title: t.navigation.newLocal, label: t.navigation.newLocal, path: LOCAUX_ADD },
				{ title: t.navigation.rentPlanning, label: t.navigation.rentPlanning, path: LOCAUX_PLANNING },
				{ title: t.navigation.locauxDashboard, label: t.navigation.locauxDashboard, path: LOCAUX_DASHBOARD },
			],
		},
		couts: {
			title: t.navigation.costs,
			icon: <PaymentsIcon />,
			items: [
				{ title: t.navigation.costsList, label: t.navigation.costsList, path: COSTS_LIST },
				{ title: t.navigation.newCost, label: t.navigation.newCost, path: COSTS_ADD },
			],
		},
		analytiques: {
			title: t.navigation.analytics,
			icon: <BarChartIcon />,
			items: [
				{ title: t.navigation.monthlyPlanning, label: t.navigation.monthlyPlanning, path: PLANNING },
				{ title: t.navigation.occupancyRate, label: t.navigation.occupancyRate, path: OCCUPANCY },
				{ title: t.navigation.balance, label: t.navigation.balance, path: BALANCE },
				{ title: t.navigation.gainsRevenues, label: t.navigation.gainsRevenues, path: GAINS },
				{ title: t.navigation.calendar, label: t.navigation.calendar, path: CALENDAR },
			],
		},
		...(isStaff && {
			utilisateurs: {
				title: t.navigation.users,
				icon: <PeopleIcon />,
				items: [
					{ title: t.navigation.usersList, label: t.navigation.usersList, path: USERS_LIST },
					{ title: t.navigation.newUser, label: t.navigation.newUser, path: USERS_ADD },
				],
			},
		}),
		parametres: {
			title: t.navigation.settings,
			icon: <SettingsIcon />,
			items: [
				{ title: t.navigation.myProfile, label: t.navigation.myProfile, path: DASHBOARD_EDIT_PROFILE },
				{ title: t.navigation.password, label: t.navigation.changePassword, path: DASHBOARD_PASSWORD },
				{ title: t.navigation.notifications, label: t.navigation.notificationPreferences, path: DASHBOARD_NOTIFICATIONS },
			],
		},
	};
};

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
	open?: boolean;
}>(({ theme, open }) => ({
	flexGrow: 1,
	paddingTop: theme.spacing(3),
	overflow: 'hidden',
	transition: theme.transitions.create('margin', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	marginLeft: 0,
	paddingBottom: '5px',

	[theme.breakpoints.up('md')]: {
		marginLeft: open ? 0 : `-${drawerWidth}px`,
		transition: theme.transitions.create('margin', {
			easing: open ? theme.transitions.easing.easeOut : theme.transitions.easing.sharp,
			duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
		}),
	},
}));

interface AppBarProps extends MuiAppBarProps {
	open?: boolean;
}

const AppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
	transition: theme.transitions.create(['margin', 'width'], {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	variants: [
		{
			props: ({ open }) => open,
			style: {
				width: `calc(100% - ${drawerWidth}px)`,
				marginLeft: `${drawerWidth}px`,
				transition: theme.transitions.create(['margin', 'width'], {
					easing: theme.transitions.easing.easeOut,
					duration: theme.transitions.duration.enteringScreen,
				}),
			},
		},
	],
}));

type Props = {
	title: string;
	children: React.ReactNode;
};

const NavigationBar = (props: Props) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const [open, setOpen] = useState(!isMobile);
	const { data: session, status } = useSession();
	const { avatar_cropped, first_name, last_name, gender, is_staff } = useAppSelector(getProfilState);
	const { t, language, setLanguage } = useLanguage();
	const navigationMenu = useMemo(() => getNavigationMenu(is_staff, t), [is_staff, t]);
	const dispatch = useAppDispatch();
	const moreVertRef = useRef<HTMLButtonElement>(null);
	const [mobileMenuAnchor, setMobileMenuAnchor] = useState<HTMLElement | null>(null);

	// Notification state
	const unreadCount = useAppSelector(getUnreadNotificationCount);
	const { data: unreadCountData } = useGetUnreadNotificationCountQuery(undefined, { skip: status !== 'authenticated' });
	const { data: notifications } = useGetNotificationsQuery(undefined, { skip: status !== 'authenticated' });
	const [markRead] = useMarkNotificationsReadMutation();
	const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);

	useEffect(() => {
		if (unreadCountData?.count !== undefined) {
			dispatch(setUnreadCount(unreadCountData.count));
		}
	}, [unreadCountData, dispatch]);

	const handleNotifOpen = (e: React.MouseEvent<HTMLElement>) => {
		setNotifAnchor(e.currentTarget);
	};
	const handleNotifClose = () => {
		setNotifAnchor(null);
	};
	const handleMarkAllRead = async () => {
		await markRead({});
		dispatch(setUnreadCount(0));
	};

	const loading = status === 'loading';

	const logOutHandler = async () => {
		await cookiesDeleter('/api/cookies', {
			pass_updated: true,
			new_email: true,
			code: true,
		});
		await signOut({ redirect: true, redirectTo: AUTH_LOGIN });
	};

	const handleDrawerToggle = () => {
		if (isMobile) {
			setOpen(!open);
		}
	};

	const pathname = usePathname();

	const [userExpanded, setUserExpanded] = useState<string | false>(false);

	const defaultExpanded: string | false = useMemo(() => {
		const exactMatch = Object.entries(navigationMenu).find(([, section]) =>
			section.items.some((item) => {
				const normalizedPath = item.path.replace(/^https?:\/\/[^/]+/, '');
				return normalizedPath === pathname;
			}),
		);

		if (exactMatch) {
			return `panel-${exactMatch[0]}`;
		}

		let bestMatch: string | null = null;
		let longestMatchLength = 0;

		Object.entries(navigationMenu).forEach(([key, section]) => {
			section.items.forEach((item) => {
				const normalizedPath = item.path.replace(/^https?:\/\/[^/]+/, '');
				const pathSegments = normalizedPath.split('/').filter(Boolean);
				const currentSegments = pathname.split('/').filter(Boolean);

				let matchCount = 0;
				for (let i = 0; i < Math.min(pathSegments.length, currentSegments.length); i++) {
					if (pathSegments[i] === currentSegments[i]) {
						matchCount++;
					} else {
						break;
					}
				}

				if (matchCount > longestMatchLength && matchCount > 0) {
					longestMatchLength = matchCount;
					bestMatch = key;
				}
			});
		});

		return bestMatch ? `panel-${bestMatch}` : false;
	}, [pathname, navigationMenu]);

	const expanded = userExpanded !== false ? userExpanded : defaultExpanded;

	const normalizePath = (url: string) => {
		try {
			return new URL(url, SITE_ROOT).pathname;
		} catch {
			return url;
		}
	};

	const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
		setUserExpanded(isExpanded ? panel : false);
	};

	return (
		<ThemeProvider theme={navigationBarTheme()}>
			<Box sx={{ display: 'flex' }}>
				<AppBar position="fixed" open={open}>
					<Toolbar>
						<Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
							<Stack direction="row" alignItems="center" spacing={1}>
								{isMobile && (
									<IconButton color="inherit" aria-label={t.common.toggleDrawer} onClick={handleDrawerToggle} size="small">
										<MenuIcon />
									</IconButton>
								)}
								<Typography variant="h6" noWrap component="div">
									{props.title}
								</Typography>
							</Stack>
							<Stack direction="row" spacing={1}>
								{!loading && session && (
									<>
										<Desktop>
											<IconButton color="inherit" onClick={handleNotifOpen}>
												<Badge badgeContent={unreadCount} color="error" max={99}>
													<NotificationsIcon />
												</Badge>
											</IconButton>
											<LanguageSwitcher />
											{is_staff && (
												<Button
													variant="text"
													color="inherit"
													href={BACKEND_SITE_ADMIN}
													target="_blank"
													rel="noopener"
													endIcon={<DomainIcon />}
												>
													{t.navigation.administration}
												</Button>
											)}
											<Button variant="text" color="inherit" endIcon={<LogoutIcon />} onClick={logOutHandler}>
												{t.navigation.logout}
											</Button>
										</Desktop>
										<TabletAndMobile>
											<IconButton
												ref={moreVertRef}
												color="inherit"
												aria-label={t.common.moreActions}
												onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
											>
												<MoreVertIcon />
											</IconButton>
											<Menu
												anchorEl={mobileMenuAnchor}
												open={Boolean(mobileMenuAnchor)}
												onClose={() => setMobileMenuAnchor(null)}
												anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
												transformOrigin={{ vertical: 'top', horizontal: 'right' }}
											>
												<MenuItem onClick={() => { setMobileMenuAnchor(null); setNotifAnchor(moreVertRef.current); }}>
													<MenuListItemIcon>
														<Badge badgeContent={unreadCount} color="error" max={99}>
															<NotificationsIcon fontSize="small" />
														</Badge>
													</MenuListItemIcon>
													<MenuListItemText>{t.navigation.notifications}</MenuListItemText>
												</MenuItem>
												<MenuItem onClick={() => { setLanguage(language === 'fr' ? 'en' : 'fr'); setMobileMenuAnchor(null); }}>
												<MenuListItemIcon><span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{language === 'fr' ? '🇬🇧' : '🇫🇷'}</span></MenuListItemIcon>
													<MenuListItemText>{language === 'fr' ? 'English' : 'Français'}</MenuListItemText>
												</MenuItem>
												{is_staff && (
													<MenuItem component="a" href={BACKEND_SITE_ADMIN} target="_blank" rel="noopener" onClick={() => setMobileMenuAnchor(null)}>
														<MenuListItemIcon><DomainIcon fontSize="small" /></MenuListItemIcon>
														<MenuListItemText>{t.navigation.administration}</MenuListItemText>
													</MenuItem>
												)}
												<MenuItem onClick={() => { setMobileMenuAnchor(null); void logOutHandler(); }}>
													<MenuListItemIcon><LogoutIcon fontSize="small" /></MenuListItemIcon>
													<MenuListItemText>{t.navigation.logout}</MenuListItemText>
												</MenuItem>
											</Menu>
										</TabletAndMobile>
									</>
								)}
							</Stack>
						</Stack>
					</Toolbar>
				</AppBar>
				<Drawer
					sx={{
						width: drawerWidth,
						flexShrink: 0,
						'& .MuiDrawer-paper': {
							width: drawerWidth,
							boxSizing: 'border-box',
						},
					}}
					variant={isMobile ? 'temporary' : 'persistent'}
					anchor="left"
					open={open}
					onClose={handleDrawerToggle}
				>
					<Divider />
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							py: 3,
							px: 2,
							gap: 2,
						}}
					>
						{!avatar_cropped ? (
							<Skeleton variant="circular" width={80} height={80} />
						) : (
							<Box sx={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden' }}>
								<Image
									src={avatar_cropped as string}
									alt={`${first_name} ${last_name}`}
									width={80}
									height={80}
									loading="eager"
									style={{ objectFit: 'contain' }}
								/>
							</Box>
						)}
						<Box sx={{ display: 'flex', flexDirection: 'column' }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
								{gender === 'Homme' ? t.navigation.welcomeMale : gender === 'Femme' ? t.navigation.welcomeFemale : t.navigation.welcomeNeutral}
							</Typography>
							<Typography variant="body2" sx={{ color: 'text.secondary' }}>
								{first_name} {last_name}
							</Typography>
						</Box>
					</Box>
					<Divider />
					<List sx={{ p: 0 }}>
						{Object.entries(navigationMenu).map(([key, section]) => (
							<Box key={key} sx={{ display: 'block' }}>
								<Accordion
									expanded={expanded === `panel-${key}`}
									onChange={handleChange(`panel-${key}`)}
									disableGutters
									elevation={0}
									sx={{
										backgroundColor: 'transparent !important',
										boxShadow: 'none !important',
										'&:before': { display: 'none' },
										margin: '0 !important',
									}}
								>
									<Tooltip title={section.title} placement="right" disableHoverListener={open}>
										<AccordionSummary
											expandIcon={open ? <ExpandMoreIcon /> : null}
											sx={[
												{
													minHeight: 48,
													margin: '0 !important',
													px: 2.5,
													'& .MuiAccordionSummary-content': {
														margin: '0 !important',
														display: 'flex',
														alignItems: 'center',
													},
												},
												open ? { justifyContent: 'initial' } : { justifyContent: 'center', px: 2.5 },
											]}
										>
											<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
												<ListItemIcon
													sx={[{ minWidth: 0, justifyContent: 'center' }, open ? { mr: 3 } : { mr: 'auto' }]}
												>
													{section.icon}
												</ListItemIcon>
												<ListItemText primary={section.title} sx={[open ? { opacity: 1 } : { opacity: 0 }]} />
											</Box>
										</AccordionSummary>
									</Tooltip>
									<AccordionDetails sx={{ p: 0, display: open ? 'block' : 'none' }}>
										{section.items.map((item, idx) => (
											<ListItem key={idx} disablePadding>
												<Link href={item.path} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
													<ListItemButton
														selected={normalizePath(item.path) === pathname}
														sx={{
															pl: open ? 9 : 2,
															minHeight: 48,
															backgroundColor: normalizePath(item.path) === pathname ? '#F0F0F0' : 'transparent',
															'&.Mui-selected': {
																backgroundColor: '#E0E0E0',
																fontWeight: 600,
															},
														}}
													>
														<ListItemText primary={item.label} />
													</ListItemButton>
												</Link>
											</ListItem>
										))}
									</AccordionDetails>
								</Accordion>
							</Box>
						))}
					</List>
				</Drawer>
				<Popover
					open={Boolean(notifAnchor)}
					anchorEl={notifAnchor}
					onClose={handleNotifClose}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
					transformOrigin={{ vertical: 'top', horizontal: 'right' }}
					slotProps={{ paper: { sx: { width: 360, maxHeight: 420 } } }}
				>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5 }}>
						<Typography variant="subtitle1" fontWeight={700}>
							{t.navigation.notifications}
						</Typography>
						{unreadCount > 0 && (
							<Tooltip title={t.navigation.markAllRead}>
								<IconButton size="small" onClick={handleMarkAllRead}>
									<DoneAllIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						)}
					</Stack>
					<Divider />
					<Box sx={{ maxHeight: 340, overflow: 'auto' }}>
						{notifications && notifications.length > 0 ? (
							notifications.map((n) => (
								<Box
									key={n.id}
									sx={{
										px: 2,
										py: 1.5,
										backgroundColor: n.is_read ? 'transparent' : 'action.hover',
										borderBottom: '1px solid',
										borderColor: 'divider',
									}}
								>
									<Typography variant="body2" fontWeight={n.is_read ? 400 : 700}>
										{n.title}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{n.message}
									</Typography>
									<Typography variant="caption" display="block" color="text.disabled" mt={0.5}>
										{formatDate(n.date_created)}
									</Typography>
								</Box>
							))
						) : (
							<Box sx={{ p: 3, textAlign: 'center' }}>
								<Typography variant="body2" color="text.secondary">
									{t.navigation.noNotifications}
								</Typography>
							</Box>
						)}
					</Box>
				</Popover>
				<Main open={open}>{props.children}</Main>
			</Box>
		</ThemeProvider>
	);
};

export default NavigationBar;
