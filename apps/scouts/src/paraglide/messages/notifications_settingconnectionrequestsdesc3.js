/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Settingconnectionrequestsdesc3Inputs */

const en_notifications_settingconnectionrequestsdesc3 = /** @type {(inputs: Notifications_Settingconnectionrequestsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When someone scans your code or clicks your user links it will initiate a network request that you can accept or deny.`)
};

const es_notifications_settingconnectionrequestsdesc3 = /** @type {(inputs: Notifications_Settingconnectionrequestsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuando alguien escanea tu código o hace clic en tus enlaces, iniciará una solicitud de red.`)
};

const fr_notifications_settingconnectionrequestsdesc3 = /** @type {(inputs: Notifications_Settingconnectionrequestsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quand quelqu'un scanne votre code ou clique sur vos liens utilisateur, une demande réseau sera initiée que vous pourrez accepter ou refuser.`)
};

const ar_notifications_settingconnectionrequestsdesc3 = /** @type {(inputs: Notifications_Settingconnectionrequestsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عندما يمسح شخص رمزك أو ينقر على روابط المستخدم الخاصة بك، سيبدأ طلب شبكة يمكنك قبوله أو رفضه.`)
};

/**
* | output |
* | --- |
* | "When someone scans your code or clicks your user links it will initiate a network request that you can accept or deny." |
*
* @param {Notifications_Settingconnectionrequestsdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_settingconnectionrequestsdesc3 = /** @type {((inputs?: Notifications_Settingconnectionrequestsdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Settingconnectionrequestsdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_settingconnectionrequestsdesc3(inputs)
	if (locale === "es") return es_notifications_settingconnectionrequestsdesc3(inputs)
	if (locale === "fr") return fr_notifications_settingconnectionrequestsdesc3(inputs)
	return ar_notifications_settingconnectionrequestsdesc3(inputs)
});
export { notifications_settingconnectionrequestsdesc3 as "notifications.settingConnectionRequestsDesc" }