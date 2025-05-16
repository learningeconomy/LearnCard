

# ProfileGetProfile200Response


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**profileId** | **String** | Unique, URL-safe identifier for the profile. |  |
|**displayName** | **String** | Human-readable display name for the profile. |  [optional] |
|**shortBio** | **String** | Short bio for the profile. |  [optional] |
|**bio** | **String** | Longer bio for the profile. |  [optional] |
|**did** | **String** | Decentralized Identifier for the profile. (auto-assigned) |  |
|**isPrivate** | **Boolean** | Whether the profile is private or not and shows up in search results. |  [optional] |
|**email** | **String** | Contact email address for the profile. |  [optional] |
|**image** | **String** | Profile image URL for the profile. |  [optional] |
|**heroImage** | **String** | Hero image URL for the profile. |  [optional] |
|**websiteLink** | **String** | Website link for the profile. |  [optional] |
|**isServiceProfile** | **Boolean** | Whether the profile is a service profile or not. |  [optional] |
|**type** | **String** | Profile type: e.g. \&quot;person\&quot;, \&quot;organization\&quot;, \&quot;service\&quot;. |  [optional] |
|**notificationsWebhook** | **URI** | URL to send notifications to. |  [optional] |
|**display** | [**BoostGetBoostRecipients200ResponseInnerToDisplay**](BoostGetBoostRecipients200ResponseInnerToDisplay.md) |  |  [optional] |
|**role** | **String** | Role of the profile: e.g. \&quot;teacher\&quot;, \&quot;student\&quot;. |  [optional] |
|**dob** | **String** | Date of birth of the profile: e.g. \&quot;1990-01-01\&quot;. |  [optional] |



