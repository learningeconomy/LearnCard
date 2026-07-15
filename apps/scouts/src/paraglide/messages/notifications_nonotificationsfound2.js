/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Nonotificationsfound2Inputs */

const en_notifications_nonotificationsfound2 = /** @type {(inputs: Notifications_Nonotificationsfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No notifications found`)
};

const es_notifications_nonotificationsfound2 = /** @type {(inputs: Notifications_Nonotificationsfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron notificaciones`)
};

const fr_notifications_nonotificationsfound2 = /** @type {(inputs: Notifications_Nonotificationsfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune notification trouvée`)
};

const ar_notifications_nonotificationsfound2 = /** @type {(inputs: Notifications_Nonotificationsfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على إشعارات`)
};

/**
* | output |
* | --- |
* | "No notifications found" |
*
* @param {Notifications_Nonotificationsfound2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_nonotificationsfound2 = /** @type {((inputs?: Notifications_Nonotificationsfound2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Nonotificationsfound2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_nonotificationsfound2(inputs)
	if (locale === "es") return es_notifications_nonotificationsfound2(inputs)
	if (locale === "fr") return fr_notifications_nonotificationsfound2(inputs)
	return ar_notifications_nonotificationsfound2(inputs)
});
export { notifications_nonotificationsfound2 as "notifications.noNotificationsFound" }