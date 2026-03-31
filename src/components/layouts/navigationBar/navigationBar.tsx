'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
	Notifications as NotificationsIcon,
	Payments as PaymentsIcon,
	People as PeopleIcon,
	Settings as SettingsIcon,
	Apartment as ApartmentIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
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
import {
	useGetNotificationsQuery,
	useGetUnreadNotificationCountQuery,
	useMarkNotificationsReadMutation,
} from '@/store/services/reservation';
import { setUnreadCount } from '@/store/slices/notificationSlice';
import { formatDate } from '@/utils/helpers';

const getNavigationMenu = (isStaff: boolean) => {
	return {
		tableau_de_bord: {
			title: 'Tableau de bord',
			icon: <DashboardIcon />,
			items: [{ title: 'Tableau de bord', label: 'Consulter le tableau de bord', path: DASHBOARD }],
		},
		reservations: {
			title: 'Réservations',
			icon: <HotelIcon />,
			items: [
				{ title: 'Liste des réservations', label: 'Liste des réservations', path: RESERVATIONS_LIST },
				{ title: 'Nouvelle réservation', label: 'Nouvelle réservation', path: RESERVATIONS_ADD },
			],
		},
		analytiques: {
			title: 'Analytiques',
			icon: <BarChartIcon />,
			items: [
				{ title: 'Planning mensuel', label: 'Planning mensuel', path: PLANNING },
				{ title: "Taux d'occupation", label: "Taux d'occupation", path: OCCUPANCY },
				{ title: 'Balance', label: 'Balance', path: BALANCE },
				{ title: 'Gains & Revenus', label: 'Gains & Revenus', path: GAINS },
				{ title: 'Calendrier', label: 'Calendrier des réservations', path: CALENDAR },
			],
		},
		couts: {
			title: 'Coûts',
			icon: <PaymentsIcon />,
			items: [
				{ title: 'Liste des coûts', label: 'Liste des coûts', path: COSTS_LIST },
				{ title: 'Nouveau coût', label: 'Nouveau coût', path: COSTS_ADD },
			],
		},
		locaux: {
			title: 'Locaux',
			icon: <DomainIcon />,
			items: [
				{ title: 'Liste des locaux', label: 'Liste des locaux', path: LOCAUX_LIST },
				{ title: 'Nouveau local', label: 'Ajouter un local', path: LOCAUX_ADD },
				{ title: 'Planning', label: 'Planning des loyers', path: LOCAUX_PLANNING },
				{ title: 'Dashboard', label: 'Dashboard des locaux', path: LOCAUX_DASHBOARD },
			],
		},
		residences: {
			title: 'Résidences',
			icon: <ApartmentIcon />,
			items: [
				{ title: 'Liste des résidences', label: 'Liste des résidences', path: BUILDINGS_LIST },
				{ title: 'Nouvelle résidence', label: 'Ajouter une résidence', path: BUILDINGS_ADD },
			],
		},
		...(isStaff && {
			utilisateurs: {
				title: 'Utilisateurs',
				icon: <PeopleIcon />,
				items: [
					{ title: 'Liste des utilisateurs', label: 'Liste des utilisateurs', path: USERS_LIST },
					{ title: 'Nouvel utilisateur', label: 'Nouvel utilisateur', path: USERS_ADD },
				],
			},
		}),
		parametres: {
			title: 'Paramètres',
			icon: <SettingsIcon />,
			items: [
				{ title: 'Mon Profil', label: 'Mon Profil', path: DASHBOARD_EDIT_PROFILE },
				{ title: 'Mot de passe', label: 'Changer le mot de passe', path: DASHBOARD_PASSWORD },
				{ title: 'Notifications', label: 'Préférences de notifications', path: DASHBOARD_NOTIFICATIONS },
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
	const navigationMenu = useMemo(() => getNavigationMenu(is_staff), [is_staff]);
	const dispatch = useAppDispatch();

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
									<IconButton color="inherit" aria-label="toggle drawer" onClick={handleDrawerToggle} size="small">
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
										<IconButton color="inherit" onClick={handleNotifOpen}>
											<Badge badgeContent={unreadCount} color="error" max={99}>
												<NotificationsIcon />
											</Badge>
										</IconButton>
										<Desktop>
											{is_staff && (
												<Button
													variant="text"
													color="inherit"
													href={BACKEND_SITE_ADMIN}
													target="_blank"
													rel="noopener"
													endIcon={<DomainIcon />}
												>
													Administration
												</Button>
											)}
											<Button variant="text" color="inherit" endIcon={<LogoutIcon />} onClick={logOutHandler}>
												Se déconnecter
											</Button>
										</Desktop>
										<TabletAndMobile>
											{is_staff && (
												<IconButton color="inherit" href={BACKEND_SITE_ADMIN} target="_blank" rel="noopener">
													<DomainIcon />
												</IconButton>
											)}
											<IconButton color="inherit" onClick={logOutHandler}>
												<LogoutIcon />
											</IconButton>
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
								{gender === 'Homme' ? 'Bienvenu' : gender === 'Femme' ? 'Bienvenue' : 'Bienvenu(e)'}
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
							Notifications
						</Typography>
						{unreadCount > 0 && (
							<Tooltip title="Tout marquer comme lu">
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
									Aucune notification
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
