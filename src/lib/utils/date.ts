// src/lib/utils/date.ts
import {
	formatDistanceToNow,
	differenceInMinutes,
	formatDuration,
	differenceInSeconds
} from 'date-fns';
import { pl } from 'date-fns/locale';

type DateTimeInput = string | number | Date | null | undefined;

export const formatDate = (
	iso: DateTimeInput,
	conditionDaysOld = 7,
	addSuffix = true
): string | null => {
	if (!iso) return null;

	const date = iso instanceof Date ? iso : new Date(iso);
	if (Number.isNaN(date.getTime())) return null;

	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays >= conditionDaysOld) {
		return new Intl.DateTimeFormat('pl-PL', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	return formatDistanceToNow(date, { locale: pl, addSuffix });
};

export const toYMDHMDate = (iso: DateTimeInput): string => {
	if (!iso) return '';

	const date = iso instanceof Date ? iso : new Date(iso);
	if (Number.isNaN(date.getTime())) return '';

	return new Intl.DateTimeFormat('pl-PL', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(date);
};

export const toHMSTime = (iso: DateTimeInput): string => {
	if (!iso) return '';

	const date = iso instanceof Date ? iso : new Date(iso);
	if (Number.isNaN(date.getTime())) return '';

	return new Intl.DateTimeFormat('pl-PL', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).format(date);
};

export const getDistanceToNow = (iso: DateTimeInput): string => {
	if (!iso) return '';

	const date = iso instanceof Date ? iso : new Date(iso);
	if (Number.isNaN(date.getTime())) return '';

	return formatDistanceToNow(date, { locale: pl, addSuffix: true });
};

export const formatDateDifference = (date1: DateTimeInput, date2: DateTimeInput): string => {
	if (!date1 || !date2) return '';

	const d1 = date1 instanceof Date ? date1 : new Date(date1);
	const d2 = date2 instanceof Date ? date2 : new Date(date2);
	if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return '';

	const totalMinutes = Math.abs(differenceInMinutes(d1, d2));
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	return (
		formatDuration(
			{ hours, minutes },
			{
				format: ['hours', 'minutes'],
				locale: pl,
				zero: false
			}
		) || '0 minut'
	);
};

export const getTimeDifference = (date1: DateTimeInput, date2: DateTimeInput): string => {
	if (date1 == null || date2 == null) return '';

	const d1 = date1 instanceof Date ? date1 : new Date(date1);
	const d2 = date2 instanceof Date ? date2 : new Date(date2);
	if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return '';

	const totalSeconds = Math.abs(differenceInSeconds(d1, d2));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
};
