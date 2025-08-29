import { HttpStatus, Injectable } from '@nestjs/common';
import { Context } from '../../context';
import { Banner } from './models/banner';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';
import { PopulateFrom, ResourceNotFoundErrorCode, SqlModelStatus, SystemErrorCode } from '../../config/types';
import { CodeException } from '../../lib/exceptions/exceptions';
import { ValidatorErrorCode } from '../../config/types';
import { ValidationException } from '../../lib/exceptions/exceptions';

@Injectable()
export class BannerService {
  /**
   * Create a banner.
   *
   * @param banner Banner.
   * @param context Application context.
   * @returns Created banner.
   */
  public async createBanner(banner: Banner, context: Context) {
    try {
      await banner.validate();
      await banner.insert();
    } catch (error) {
      await banner.handle(error);
      if (!banner.isValid()) {
        throw new ValidationException(error, ValidatorErrorCode);
      } else {
        throw new CodeException({
          code: SystemErrorCode.SQL_SYSTEM_ERROR,
          errorCodes: SystemErrorCode,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          sourceFunction: `${this.constructor.name}/createbanner`,
          details: error,
          context
        });
      }
    }
    return banner;
  }

  /**
   * Update banner.
   *
   * @param id Banner ID.
   * @param banner Banner.
   * @param context Application context.
   * @returns Updated banner.
   */
  public async updateBanner(id: number, bannerData: Banner, context: Context) {
    const banner = await new Banner({}, context).populateById(id);
    if (!banner.exists() || !banner.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.BANNER_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/updatebanner`,
        context
      });
    }

    banner.populate(bannerData, PopulateFrom.USER);
    try {
      await banner.update();
    } catch (error) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/updatebanner`,
        details: error,
        context
      });
    }
    return banner;
  }

  /**
   * Get active banners.
   *
   * @param context Application context.
   * @returns Active banners.
   */
  public async getBanners(context: Context) {
    return await new Banner({}, context).getActive();
  }

  /**
   * Get banners for admin.
   *
   * @param context Application context.
   * @returns Banners for admin.
   */
  public async getBannersAdmin(query: BaseQueryFilter, context: Context) {
    return await new Banner({}, context).getList(query);
  }

  /**
   * Toggle banner.
   *
   * @param id Banner ID.
   * @param context Application context.
   * @returns Toggled banner.
   */
  public async toggleBanner(id: number, context: Context) {
    const banner = await new Banner({}, context).populateById(id);
    banner.isActive = !banner.isActive;
    await banner.update();
    return banner;
  }

  /**
   * Delete banner.
   *
   * @param id Banner ID.
   * @param context Application context.
   * @returns Deleted banner.
   */
  public async deleteBanner(id: number, context: Context) {
    const banner = await new Banner({}, context).populateById(id);
    banner.status = SqlModelStatus.DELETED;
    await banner.update();
    return banner;
  }
}
