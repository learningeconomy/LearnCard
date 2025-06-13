

# AuthGrantsGetAuthGrant200Response


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**id** | **String** |  |  [optional] |
|**name** | **String** |  |  [optional] |
|**description** | **String** |  |  [optional] |
|**challenge** | **String** |  |  [optional] |
|**status** | [**StatusEnum**](#StatusEnum) |  |  [optional] |
|**scope** | **String** |  |  [optional] |
|**createdAt** | **OffsetDateTime** |  |  [optional] |
|**expiresAt** | **OffsetDateTime** |  |  [optional] |



## Enum: StatusEnum

| Name | Value |
|---- | -----|
| REVOKED | &quot;revoked&quot; |
| ACTIVE | &quot;active&quot; |



