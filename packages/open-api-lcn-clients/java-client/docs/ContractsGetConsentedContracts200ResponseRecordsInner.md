

# ContractsGetConsentedContracts200ResponseRecordsInner


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**expiresAt** | **String** |  |  [optional] |
|**oneTime** | **Boolean** |  |  [optional] |
|**terms** | [**StorageResolve200ResponseAnyOf1**](StorageResolve200ResponseAnyOf1.md) |  |  |
|**contract** | [**ContractsGetConsentFlowContract200Response**](ContractsGetConsentFlowContract200Response.md) |  |  |
|**uri** | **String** |  |  |
|**consenter** | [**BoostGetBoostRecipients200ResponseInnerTo**](BoostGetBoostRecipients200ResponseInnerTo.md) |  |  |
|**status** | [**StatusEnum**](#StatusEnum) |  |  |



## Enum: StatusEnum

| Name | Value |
|---- | -----|
| LIVE | &quot;live&quot; |
| STALE | &quot;stale&quot; |
| WITHDRAWN | &quot;withdrawn&quot; |



