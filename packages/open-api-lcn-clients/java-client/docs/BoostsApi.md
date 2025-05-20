# BoostsApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**boostAddBoostAdmin**](BoostsApi.md#boostAddBoostAdmin) | **POST** /boost/add-admin | Add a Boost admin |
| [**boostClaimBoostWithLink**](BoostsApi.md#boostClaimBoostWithLink) | **POST** /boost/claim | Claim a boost using a claim link |
| [**boostCountBoostChildren**](BoostsApi.md#boostCountBoostChildren) | **POST** /boost/children/count | Count boost children |
| [**boostCountBoostParents**](BoostsApi.md#boostCountBoostParents) | **POST** /boost/parents/count | Count boost parents |
| [**boostCountBoostSiblings**](BoostsApi.md#boostCountBoostSiblings) | **POST** /boost/siblings/count | Count boost siblings |
| [**boostCountBoosts**](BoostsApi.md#boostCountBoosts) | **POST** /boost/count | Count managed boosts |
| [**boostCountFamilialBoosts**](BoostsApi.md#boostCountFamilialBoosts) | **POST** /boost/family/count | Count familial boosts |
| [**boostCreateBoost**](BoostsApi.md#boostCreateBoost) | **POST** /boost/create | Creates a boost |
| [**boostCreateChildBoost**](BoostsApi.md#boostCreateChildBoost) | **POST** /boost/create/child | Creates a boost |
| [**boostDeleteBoost**](BoostsApi.md#boostDeleteBoost) | **DELETE** /boost | Delete a boost |
| [**boostGenerateClaimLink**](BoostsApi.md#boostGenerateClaimLink) | **POST** /boost/generate-claim-link | Generate a claim link for a boost |
| [**boostGetBoost**](BoostsApi.md#boostGetBoost) | **GET** /boost | Get boost |
| [**boostGetBoostAdmins**](BoostsApi.md#boostGetBoostAdmins) | **POST** /boost/admins | Get boost admins |
| [**boostGetBoostChildren**](BoostsApi.md#boostGetBoostChildren) | **POST** /boost/children | Get boost children |
| [**boostGetBoostParents**](BoostsApi.md#boostGetBoostParents) | **POST** /boost/parents | Get boost parents |
| [**boostGetBoostPermissions**](BoostsApi.md#boostGetBoostPermissions) | **GET** /boost/permissions | Get boost permissions |
| [**boostGetBoostRecipientCount**](BoostsApi.md#boostGetBoostRecipientCount) | **GET** /boost/recipients/count | Get boost recipients count |
| [**boostGetBoostRecipients**](BoostsApi.md#boostGetBoostRecipients) | **GET** /boost/recipients | Get boost recipients |
| [**boostGetBoostSiblings**](BoostsApi.md#boostGetBoostSiblings) | **POST** /boost/siblings | Get boost siblings |
| [**boostGetBoosts**](BoostsApi.md#boostGetBoosts) | **POST** /boost/all | Get boosts |
| [**boostGetChildrenProfileManagers**](BoostsApi.md#boostGetChildrenProfileManagers) | **POST** /boost/children-profile-managers | Get Profile Managers that are a child of a boost |
| [**boostGetFamilialBoosts**](BoostsApi.md#boostGetFamilialBoosts) | **POST** /boost/family | Get familial boosts |
| [**boostGetOtherBoostPermissions**](BoostsApi.md#boostGetOtherBoostPermissions) | **GET** /boost/permissions/{profileId} | Get boost permissions for someone else |
| [**boostGetPaginatedBoostRecipients**](BoostsApi.md#boostGetPaginatedBoostRecipients) | **POST** /boost/recipients/paginated | Get boost recipients |
| [**boostGetPaginatedBoosts**](BoostsApi.md#boostGetPaginatedBoosts) | **POST** /boost/paginated | Get boosts |
| [**boostMakeBoostParent**](BoostsApi.md#boostMakeBoostParent) | **POST** /boost/make-parent | Make Boost Parent |
| [**boostRemoveBoostAdmin**](BoostsApi.md#boostRemoveBoostAdmin) | **POST** /boost/remove-admin | Remove a Boost admin |
| [**boostRemoveBoostParent**](BoostsApi.md#boostRemoveBoostParent) | **POST** /boost/remove-parent | Remove Boost Parent |
| [**boostSendBoost**](BoostsApi.md#boostSendBoost) | **POST** /boost/send/{profileId} | Send a Boost |
| [**boostSendBoostViaSigningAuthority**](BoostsApi.md#boostSendBoostViaSigningAuthority) | **POST** /boost/send/via-signing-authority/{profileId} | Send a boost to a profile using a signing authority |
| [**boostUpdateBoost**](BoostsApi.md#boostUpdateBoost) | **POST** /boost | Update a boost |
| [**boostUpdateBoostPermissions**](BoostsApi.md#boostUpdateBoostPermissions) | **POST** /boost/permissions | Update boost permissions |
| [**boostUpdateOtherBoostPermissions**](BoostsApi.md#boostUpdateOtherBoostPermissions) | **POST** /boost/permissions/{profileId} | Update other profile&#39;s boost permissions |


<a id="boostAddBoostAdmin"></a>
# **boostAddBoostAdmin**
> Boolean boostAddBoostAdmin(boostAddBoostAdminRequest)

Add a Boost admin

This route adds a new admin for a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostAddBoostAdminRequest boostAddBoostAdminRequest = new BoostAddBoostAdminRequest(); // BoostAddBoostAdminRequest | 
    try {
      Boolean result = apiInstance.boostAddBoostAdmin(boostAddBoostAdminRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostAddBoostAdmin");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostAddBoostAdminRequest** | [**BoostAddBoostAdminRequest**](BoostAddBoostAdminRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostClaimBoostWithLink"></a>
# **boostClaimBoostWithLink**
> String boostClaimBoostWithLink(boostGenerateClaimLink200Response)

Claim a boost using a claim link

Claims a boost using a claim link, including a challenge

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGenerateClaimLink200Response boostGenerateClaimLink200Response = new BoostGenerateClaimLink200Response(); // BoostGenerateClaimLink200Response | 
    try {
      String result = apiInstance.boostClaimBoostWithLink(boostGenerateClaimLink200Response);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostClaimBoostWithLink");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGenerateClaimLink200Response** | [**BoostGenerateClaimLink200Response**](BoostGenerateClaimLink200Response.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostCountBoostChildren"></a>
# **boostCountBoostChildren**
> BigDecimal boostCountBoostChildren(boostCountBoostChildrenRequest)

Count boost children

This endpoint counts the children of a particular boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostCountBoostChildrenRequest boostCountBoostChildrenRequest = new BoostCountBoostChildrenRequest(); // BoostCountBoostChildrenRequest | 
    try {
      BigDecimal result = apiInstance.boostCountBoostChildren(boostCountBoostChildrenRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostCountBoostChildren");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostCountBoostChildrenRequest** | [**BoostCountBoostChildrenRequest**](BoostCountBoostChildrenRequest.md)|  | |

### Return type

[**BigDecimal**](BigDecimal.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostCountBoostParents"></a>
# **boostCountBoostParents**
> BigDecimal boostCountBoostParents(boostCountBoostChildrenRequest)

Count boost parents

This endpoint counts the parents of a particular boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostCountBoostChildrenRequest boostCountBoostChildrenRequest = new BoostCountBoostChildrenRequest(); // BoostCountBoostChildrenRequest | 
    try {
      BigDecimal result = apiInstance.boostCountBoostParents(boostCountBoostChildrenRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostCountBoostParents");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostCountBoostChildrenRequest** | [**BoostCountBoostChildrenRequest**](BoostCountBoostChildrenRequest.md)|  | |

### Return type

[**BigDecimal**](BigDecimal.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostCountBoostSiblings"></a>
# **boostCountBoostSiblings**
> BigDecimal boostCountBoostSiblings(boostCountBoostSiblingsRequest)

Count boost siblings

This endpoint counts the siblings of a particular boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostCountBoostSiblingsRequest boostCountBoostSiblingsRequest = new BoostCountBoostSiblingsRequest(); // BoostCountBoostSiblingsRequest | 
    try {
      BigDecimal result = apiInstance.boostCountBoostSiblings(boostCountBoostSiblingsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostCountBoostSiblings");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostCountBoostSiblingsRequest** | [**BoostCountBoostSiblingsRequest**](BoostCountBoostSiblingsRequest.md)|  | |

### Return type

[**BigDecimal**](BigDecimal.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostCountBoosts"></a>
# **boostCountBoosts**
> BigDecimal boostCountBoosts(boostGetBoostsRequest)

Count managed boosts

This endpoint counts the current user&#39;s managed boosts.

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGetBoostsRequest boostGetBoostsRequest = new BoostGetBoostsRequest(); // BoostGetBoostsRequest | 
    try {
      BigDecimal result = apiInstance.boostCountBoosts(boostGetBoostsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostCountBoosts");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetBoostsRequest** | [**BoostGetBoostsRequest**](BoostGetBoostsRequest.md)|  | [optional] |

### Return type

[**BigDecimal**](BigDecimal.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostCountFamilialBoosts"></a>
# **boostCountFamilialBoosts**
> BigDecimal boostCountFamilialBoosts(boostCountFamilialBoostsRequest)

Count familial boosts

This endpoint counts the parents, children, and siblings of a particular boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostCountFamilialBoostsRequest boostCountFamilialBoostsRequest = new BoostCountFamilialBoostsRequest(); // BoostCountFamilialBoostsRequest | 
    try {
      BigDecimal result = apiInstance.boostCountFamilialBoosts(boostCountFamilialBoostsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostCountFamilialBoosts");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostCountFamilialBoostsRequest** | [**BoostCountFamilialBoostsRequest**](BoostCountFamilialBoostsRequest.md)|  | |

### Return type

[**BigDecimal**](BigDecimal.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostCreateBoost"></a>
# **boostCreateBoost**
> String boostCreateBoost(boostCreateBoostRequest)

Creates a boost

This route creates a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostCreateBoostRequest boostCreateBoostRequest = new BoostCreateBoostRequest(); // BoostCreateBoostRequest | 
    try {
      String result = apiInstance.boostCreateBoost(boostCreateBoostRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostCreateBoost");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostCreateBoostRequest** | [**BoostCreateBoostRequest**](BoostCreateBoostRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostCreateChildBoost"></a>
# **boostCreateChildBoost**
> String boostCreateChildBoost(boostCreateChildBoostRequest)

Creates a boost

This route creates a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostCreateChildBoostRequest boostCreateChildBoostRequest = new BoostCreateChildBoostRequest(); // BoostCreateChildBoostRequest | 
    try {
      String result = apiInstance.boostCreateChildBoost(boostCreateChildBoostRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostCreateChildBoost");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostCreateChildBoostRequest** | [**BoostCreateChildBoostRequest**](BoostCreateChildBoostRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostDeleteBoost"></a>
# **boostDeleteBoost**
> Boolean boostDeleteBoost(uri)

Delete a boost

This route deletes a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    String uri = "uri_example"; // String | 
    try {
      Boolean result = apiInstance.boostDeleteBoost(uri);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostDeleteBoost");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGenerateClaimLink"></a>
# **boostGenerateClaimLink**
> BoostGenerateClaimLink200Response boostGenerateClaimLink(boostGenerateClaimLinkRequest)

Generate a claim link for a boost

This route creates a challenge that an unknown profile can use to claim a boost.

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGenerateClaimLinkRequest boostGenerateClaimLinkRequest = new BoostGenerateClaimLinkRequest(); // BoostGenerateClaimLinkRequest | 
    try {
      BoostGenerateClaimLink200Response result = apiInstance.boostGenerateClaimLink(boostGenerateClaimLinkRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGenerateClaimLink");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGenerateClaimLinkRequest** | [**BoostGenerateClaimLinkRequest**](BoostGenerateClaimLinkRequest.md)|  | |

### Return type

[**BoostGenerateClaimLink200Response**](BoostGenerateClaimLink200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetBoost"></a>
# **boostGetBoost**
> BoostGetBoost200Response boostGetBoost(uri)

Get boost

This endpoint gets metadata about a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    String uri = "uri_example"; // String | 
    try {
      BoostGetBoost200Response result = apiInstance.boostGetBoost(uri);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetBoost");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |

### Return type

[**BoostGetBoost200Response**](BoostGetBoost200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetBoostAdmins"></a>
# **boostGetBoostAdmins**
> BoostGetBoostAdmins200Response boostGetBoostAdmins(boostGetBoostAdminsRequest)

Get boost admins

This route returns the admins for a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGetBoostAdminsRequest boostGetBoostAdminsRequest = new BoostGetBoostAdminsRequest(); // BoostGetBoostAdminsRequest | 
    try {
      BoostGetBoostAdmins200Response result = apiInstance.boostGetBoostAdmins(boostGetBoostAdminsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetBoostAdmins");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetBoostAdminsRequest** | [**BoostGetBoostAdminsRequest**](BoostGetBoostAdminsRequest.md)|  | |

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetBoostChildren"></a>
# **boostGetBoostChildren**
> BoostGetPaginatedBoosts200Response boostGetBoostChildren(boostGetBoostChildrenRequest)

Get boost children

This endpoint gets the children of a particular boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGetBoostChildrenRequest boostGetBoostChildrenRequest = new BoostGetBoostChildrenRequest(); // BoostGetBoostChildrenRequest | 
    try {
      BoostGetPaginatedBoosts200Response result = apiInstance.boostGetBoostChildren(boostGetBoostChildrenRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetBoostChildren");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetBoostChildrenRequest** | [**BoostGetBoostChildrenRequest**](BoostGetBoostChildrenRequest.md)|  | |

### Return type

[**BoostGetPaginatedBoosts200Response**](BoostGetPaginatedBoosts200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetBoostParents"></a>
# **boostGetBoostParents**
> BoostGetPaginatedBoosts200Response boostGetBoostParents(boostGetBoostChildrenRequest)

Get boost parents

This endpoint gets the parents of a particular boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGetBoostChildrenRequest boostGetBoostChildrenRequest = new BoostGetBoostChildrenRequest(); // BoostGetBoostChildrenRequest | 
    try {
      BoostGetPaginatedBoosts200Response result = apiInstance.boostGetBoostParents(boostGetBoostChildrenRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetBoostParents");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetBoostChildrenRequest** | [**BoostGetBoostChildrenRequest**](BoostGetBoostChildrenRequest.md)|  | |

### Return type

[**BoostGetPaginatedBoosts200Response**](BoostGetPaginatedBoosts200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetBoostPermissions"></a>
# **boostGetBoostPermissions**
> BoostGetBoost200ResponseClaimPermissions boostGetBoostPermissions(uri)

Get boost permissions

This endpoint gets permission metadata about a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    String uri = "uri_example"; // String | 
    try {
      BoostGetBoost200ResponseClaimPermissions result = apiInstance.boostGetBoostPermissions(uri);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetBoostPermissions");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |

### Return type

[**BoostGetBoost200ResponseClaimPermissions**](BoostGetBoost200ResponseClaimPermissions.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetBoostRecipientCount"></a>
# **boostGetBoostRecipientCount**
> BigDecimal boostGetBoostRecipientCount(uri, includeUnacceptedBoosts)

Get boost recipients count

This endpoint counts the recipients of a particular boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    String uri = "uri_example"; // String | 
    Boolean includeUnacceptedBoosts = true; // Boolean | 
    try {
      BigDecimal result = apiInstance.boostGetBoostRecipientCount(uri, includeUnacceptedBoosts);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetBoostRecipientCount");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |
| **includeUnacceptedBoosts** | **Boolean**|  | [optional] [default to true] |

### Return type

[**BigDecimal**](BigDecimal.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetBoostRecipients"></a>
# **boostGetBoostRecipients**
> List&lt;BoostGetBoostRecipients200ResponseInner&gt; boostGetBoostRecipients(uri, limit, skip, includeUnacceptedBoosts)

Get boost recipients

This endpoint gets the recipients of a particular boost. Warning! This route is deprecated and currently has a hard limit of returning only the first 50 boosts. Please use getPaginatedBoostRecipients instead

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    String uri = "uri_example"; // String | 
    BigDecimal limit = new BigDecimal(78); // BigDecimal | 
    BigDecimal skip = new BigDecimal(78); // BigDecimal | 
    Boolean includeUnacceptedBoosts = true; // Boolean | 
    try {
      List<BoostGetBoostRecipients200ResponseInner> result = apiInstance.boostGetBoostRecipients(uri, limit, skip, includeUnacceptedBoosts);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetBoostRecipients");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |
| **limit** | **BigDecimal**|  | [optional] |
| **skip** | **BigDecimal**|  | [optional] |
| **includeUnacceptedBoosts** | **Boolean**|  | [optional] [default to true] |

### Return type

[**List&lt;BoostGetBoostRecipients200ResponseInner&gt;**](BoostGetBoostRecipients200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetBoostSiblings"></a>
# **boostGetBoostSiblings**
> BoostGetPaginatedBoosts200Response boostGetBoostSiblings(boostGetBoostSiblingsRequest)

Get boost siblings

This endpoint gets the siblings of a particular boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGetBoostSiblingsRequest boostGetBoostSiblingsRequest = new BoostGetBoostSiblingsRequest(); // BoostGetBoostSiblingsRequest | 
    try {
      BoostGetPaginatedBoosts200Response result = apiInstance.boostGetBoostSiblings(boostGetBoostSiblingsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetBoostSiblings");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetBoostSiblingsRequest** | [**BoostGetBoostSiblingsRequest**](BoostGetBoostSiblingsRequest.md)|  | |

### Return type

[**BoostGetPaginatedBoosts200Response**](BoostGetPaginatedBoosts200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetBoosts"></a>
# **boostGetBoosts**
> List&lt;BoostGetBoosts200ResponseInner&gt; boostGetBoosts(boostGetBoostsRequest)

Get boosts

This endpoint gets the current user&#39;s boosts. Warning! This route is deprecated and currently has a hard limit of returning only the first 50 boosts. Please use getPaginatedBoosts instead

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGetBoostsRequest boostGetBoostsRequest = new BoostGetBoostsRequest(); // BoostGetBoostsRequest | 
    try {
      List<BoostGetBoosts200ResponseInner> result = apiInstance.boostGetBoosts(boostGetBoostsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetBoosts");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetBoostsRequest** | [**BoostGetBoostsRequest**](BoostGetBoostsRequest.md)|  | [optional] |

### Return type

[**List&lt;BoostGetBoosts200ResponseInner&gt;**](BoostGetBoosts200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetChildrenProfileManagers"></a>
# **boostGetChildrenProfileManagers**
> BoostGetChildrenProfileManagers200Response boostGetChildrenProfileManagers(boostGetChildrenProfileManagersRequest)

Get Profile Managers that are a child of a boost

Get Profile Managers that are a child of a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGetChildrenProfileManagersRequest boostGetChildrenProfileManagersRequest = new BoostGetChildrenProfileManagersRequest(); // BoostGetChildrenProfileManagersRequest | 
    try {
      BoostGetChildrenProfileManagers200Response result = apiInstance.boostGetChildrenProfileManagers(boostGetChildrenProfileManagersRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetChildrenProfileManagers");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetChildrenProfileManagersRequest** | [**BoostGetChildrenProfileManagersRequest**](BoostGetChildrenProfileManagersRequest.md)|  | |

### Return type

[**BoostGetChildrenProfileManagers200Response**](BoostGetChildrenProfileManagers200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetFamilialBoosts"></a>
# **boostGetFamilialBoosts**
> BoostGetPaginatedBoosts200Response boostGetFamilialBoosts(boostGetFamilialBoostsRequest)

Get familial boosts

This endpoint gets the parents, children, and siblings of a particular boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGetFamilialBoostsRequest boostGetFamilialBoostsRequest = new BoostGetFamilialBoostsRequest(); // BoostGetFamilialBoostsRequest | 
    try {
      BoostGetPaginatedBoosts200Response result = apiInstance.boostGetFamilialBoosts(boostGetFamilialBoostsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetFamilialBoosts");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetFamilialBoostsRequest** | [**BoostGetFamilialBoostsRequest**](BoostGetFamilialBoostsRequest.md)|  | |

### Return type

[**BoostGetPaginatedBoosts200Response**](BoostGetPaginatedBoosts200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetOtherBoostPermissions"></a>
# **boostGetOtherBoostPermissions**
> BoostGetBoost200ResponseClaimPermissions boostGetOtherBoostPermissions(uri, profileId)

Get boost permissions for someone else

This endpoint gets permission metadata about a boost for someone else

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    String uri = "uri_example"; // String | 
    String profileId = "profileId_example"; // String | 
    try {
      BoostGetBoost200ResponseClaimPermissions result = apiInstance.boostGetOtherBoostPermissions(uri, profileId);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetOtherBoostPermissions");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |
| **profileId** | **String**|  | |

### Return type

[**BoostGetBoost200ResponseClaimPermissions**](BoostGetBoost200ResponseClaimPermissions.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetPaginatedBoostRecipients"></a>
# **boostGetPaginatedBoostRecipients**
> BoostGetPaginatedBoostRecipients200Response boostGetPaginatedBoostRecipients(boostGetPaginatedBoostRecipientsRequest)

Get boost recipients

This endpoint gets the recipients of a particular boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGetPaginatedBoostRecipientsRequest boostGetPaginatedBoostRecipientsRequest = new BoostGetPaginatedBoostRecipientsRequest(); // BoostGetPaginatedBoostRecipientsRequest | 
    try {
      BoostGetPaginatedBoostRecipients200Response result = apiInstance.boostGetPaginatedBoostRecipients(boostGetPaginatedBoostRecipientsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetPaginatedBoostRecipients");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetPaginatedBoostRecipientsRequest** | [**BoostGetPaginatedBoostRecipientsRequest**](BoostGetPaginatedBoostRecipientsRequest.md)|  | |

### Return type

[**BoostGetPaginatedBoostRecipients200Response**](BoostGetPaginatedBoostRecipients200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostGetPaginatedBoosts"></a>
# **boostGetPaginatedBoosts**
> BoostGetPaginatedBoosts200Response boostGetPaginatedBoosts(boostGetPaginatedBoostsRequest)

Get boosts

This endpoint gets the current user&#39;s boosts

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostGetPaginatedBoostsRequest boostGetPaginatedBoostsRequest = new BoostGetPaginatedBoostsRequest(); // BoostGetPaginatedBoostsRequest | 
    try {
      BoostGetPaginatedBoosts200Response result = apiInstance.boostGetPaginatedBoosts(boostGetPaginatedBoostsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostGetPaginatedBoosts");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetPaginatedBoostsRequest** | [**BoostGetPaginatedBoostsRequest**](BoostGetPaginatedBoostsRequest.md)|  | [optional] |

### Return type

[**BoostGetPaginatedBoosts200Response**](BoostGetPaginatedBoosts200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostMakeBoostParent"></a>
# **boostMakeBoostParent**
> Boolean boostMakeBoostParent(boostMakeBoostParentRequest)

Make Boost Parent

This endpoint creates a parent/child relationship between two boosts

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostMakeBoostParentRequest boostMakeBoostParentRequest = new BoostMakeBoostParentRequest(); // BoostMakeBoostParentRequest | 
    try {
      Boolean result = apiInstance.boostMakeBoostParent(boostMakeBoostParentRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostMakeBoostParent");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostMakeBoostParentRequest** | [**BoostMakeBoostParentRequest**](BoostMakeBoostParentRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostRemoveBoostAdmin"></a>
# **boostRemoveBoostAdmin**
> Boolean boostRemoveBoostAdmin(boostAddBoostAdminRequest)

Remove a Boost admin

This route removes an  admin from a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostAddBoostAdminRequest boostAddBoostAdminRequest = new BoostAddBoostAdminRequest(); // BoostAddBoostAdminRequest | 
    try {
      Boolean result = apiInstance.boostRemoveBoostAdmin(boostAddBoostAdminRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostRemoveBoostAdmin");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostAddBoostAdminRequest** | [**BoostAddBoostAdminRequest**](BoostAddBoostAdminRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostRemoveBoostParent"></a>
# **boostRemoveBoostParent**
> Boolean boostRemoveBoostParent(boostMakeBoostParentRequest)

Remove Boost Parent

This endpoint removes a parent/child relationship between two boosts

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostMakeBoostParentRequest boostMakeBoostParentRequest = new BoostMakeBoostParentRequest(); // BoostMakeBoostParentRequest | 
    try {
      Boolean result = apiInstance.boostRemoveBoostParent(boostMakeBoostParentRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostRemoveBoostParent");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostMakeBoostParentRequest** | [**BoostMakeBoostParentRequest**](BoostMakeBoostParentRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostSendBoost"></a>
# **boostSendBoost**
> String boostSendBoost(profileId, boostSendBoostRequest)

Send a Boost

This endpoint sends a boost to a profile

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    BoostSendBoostRequest boostSendBoostRequest = new BoostSendBoostRequest(); // BoostSendBoostRequest | 
    try {
      String result = apiInstance.boostSendBoost(profileId, boostSendBoostRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostSendBoost");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |
| **boostSendBoostRequest** | [**BoostSendBoostRequest**](BoostSendBoostRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostSendBoostViaSigningAuthority"></a>
# **boostSendBoostViaSigningAuthority**
> String boostSendBoostViaSigningAuthority(profileId, boostSendBoostViaSigningAuthorityRequest)

Send a boost to a profile using a signing authority

Issues a boost VC to a recipient profile using a specified signing authority and sends it via the network.

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    BoostSendBoostViaSigningAuthorityRequest boostSendBoostViaSigningAuthorityRequest = new BoostSendBoostViaSigningAuthorityRequest(); // BoostSendBoostViaSigningAuthorityRequest | 
    try {
      String result = apiInstance.boostSendBoostViaSigningAuthority(profileId, boostSendBoostViaSigningAuthorityRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostSendBoostViaSigningAuthority");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |
| **boostSendBoostViaSigningAuthorityRequest** | [**BoostSendBoostViaSigningAuthorityRequest**](BoostSendBoostViaSigningAuthorityRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostUpdateBoost"></a>
# **boostUpdateBoost**
> Boolean boostUpdateBoost(boostUpdateBoostRequest)

Update a boost

This route updates a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostUpdateBoostRequest boostUpdateBoostRequest = new BoostUpdateBoostRequest(); // BoostUpdateBoostRequest | 
    try {
      Boolean result = apiInstance.boostUpdateBoost(boostUpdateBoostRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostUpdateBoost");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostUpdateBoostRequest** | [**BoostUpdateBoostRequest**](BoostUpdateBoostRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostUpdateBoostPermissions"></a>
# **boostUpdateBoostPermissions**
> Boolean boostUpdateBoostPermissions(boostUpdateBoostPermissionsRequest)

Update boost permissions

This endpoint updates permission metadata about a boost for the current user

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    BoostUpdateBoostPermissionsRequest boostUpdateBoostPermissionsRequest = new BoostUpdateBoostPermissionsRequest(); // BoostUpdateBoostPermissionsRequest | 
    try {
      Boolean result = apiInstance.boostUpdateBoostPermissions(boostUpdateBoostPermissionsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostUpdateBoostPermissions");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostUpdateBoostPermissionsRequest** | [**BoostUpdateBoostPermissionsRequest**](BoostUpdateBoostPermissionsRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="boostUpdateOtherBoostPermissions"></a>
# **boostUpdateOtherBoostPermissions**
> Boolean boostUpdateOtherBoostPermissions(profileId, boostUpdateBoostPermissionsRequest)

Update other profile&#39;s boost permissions

This endpoint updates permission metadata about a boost for another user

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.BoostsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    BoostsApi apiInstance = new BoostsApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    BoostUpdateBoostPermissionsRequest boostUpdateBoostPermissionsRequest = new BoostUpdateBoostPermissionsRequest(); // BoostUpdateBoostPermissionsRequest | 
    try {
      Boolean result = apiInstance.boostUpdateOtherBoostPermissions(profileId, boostUpdateBoostPermissionsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling BoostsApi#boostUpdateOtherBoostPermissions");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |
| **boostUpdateBoostPermissionsRequest** | [**BoostUpdateBoostPermissionsRequest**](BoostUpdateBoostPermissionsRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

