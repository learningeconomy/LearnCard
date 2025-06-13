

# ContractsGetTermsTransactionHistory200ResponseRecordsInner


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**expiresAt** | **String** |  |  [optional] |
|**oneTime** | **Boolean** |  |  [optional] |
|**terms** | [**StorageResolve200ResponseAnyOf1**](StorageResolve200ResponseAnyOf1.md) |  |  [optional] |
|**id** | **String** |  |  |
|**action** | [**ActionEnum**](#ActionEnum) |  |  |
|**date** | **String** |  |  |
|**uris** | **List&lt;String&gt;** |  |  [optional] |



## Enum: ActionEnum

| Name | Value |
|---- | -----|
| CONSENT | &quot;consent&quot; |
| UPDATE | &quot;update&quot; |
| SYNC | &quot;sync&quot; |
| WITHDRAW | &quot;withdraw&quot; |
| WRITE | &quot;write&quot; |



