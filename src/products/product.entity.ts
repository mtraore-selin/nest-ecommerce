import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Product extends Document {
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  price: number;

  @Prop()
  discountPercentage: number;

  @Prop()
  rating: number;

  @Prop()
  stock: number;

  @Prop()
  brand: string;

  @Prop()
  category: string;

  @Prop()
  thumbnail: string;

  @Prop({ type: [String] })
  images: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
